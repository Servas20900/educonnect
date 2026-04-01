from rest_framework import viewsets, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Max
from django.utils import timezone
from apps.databaseModels.models import AuthAuditoriaLog
from .serializers import ReadSerializerAuthAuditoriaLog


class ViewAuthAuditoriaLog(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para los logs de auditoría.
    """
    queryset = AuthAuditoriaLog.objects.all().select_related('usuario', 'usuario__persona')
    serializer_class = ReadSerializerAuthAuditoriaLog
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['usuario__email', 'accion', 'modulo', 'descripcion']
    ordering_fields = ['fecha_hora', 'accion', 'modulo']
    ordering = ['-fecha_hora']


def _email_usuario(valor_usuario):
    if not valor_usuario:
        return "Sistema"
    if hasattr(valor_usuario, "email"):
        return valor_usuario.email
    return str(valor_usuario)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reporte_uso_sistema(request):
    desde = timezone.now() - timezone.timedelta(days=30)
    queryset = (
        AuthAuditoriaLog.objects
        .filter(fecha_hora__gte=desde)
        .select_related("usuario")
        .values("usuario", "usuario__email")
        .annotate(
            total_acciones=Count("id"),
            ultima_accion=Max("fecha_hora"),
        )
        .order_by("-total_acciones", "-ultima_accion")
    )

    data = [
        {
            "usuario": item["usuario__email"] if item["usuario__email"] else "Sistema",
            "total_acciones": item["total_acciones"],
            "ultima_accion": item["ultima_accion"],
        }
        for item in queryset
    ]
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reporte_por_modulo(request):
    desde = timezone.now() - timezone.timedelta(days=30)
    queryset = (
        AuthAuditoriaLog.objects
        .filter(fecha_hora__gte=desde)
        .values("modulo")
        .annotate(total_acciones=Count("id"))
        .order_by("-total_acciones", "modulo")
    )

    data = [
        {
            "modulo": item["modulo"],
            "total_acciones": item["total_acciones"],
        }
        for item in queryset
    ]
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reporte_errores(request):
    desde = timezone.now() - timezone.timedelta(days=30)
    logs = (
        AuthAuditoriaLog.objects
        .filter(fecha_hora__gte=desde, resultado="Error")
        .select_related("usuario")
        .order_by("-fecha_hora")
    )

    data = []
    for log in logs:
        metodo = ""
        endpoint = ""
        if log.descripcion:
            partes = log.descripcion.split(" ", 1)
            if len(partes) == 2:
                metodo, endpoint = partes[0], partes[1]
            elif len(partes) == 1:
                endpoint = partes[0]

        status_code = None
        if log.mensaje_error and log.mensaje_error.startswith("HTTP "):
            try:
                status_code = int(log.mensaje_error.split(" ")[1])
            except (ValueError, IndexError):
                status_code = None

        if status_code is not None and status_code >= 400:
            data.append(
                {
                    "usuario": _email_usuario(log.usuario),
                    "endpoint": endpoint,
                    "status_code": status_code,
                    "fecha": log.fecha_hora,
                    "metodo": metodo,
                }
            )

    return Response(data)
