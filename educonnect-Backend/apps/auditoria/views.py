from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
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
