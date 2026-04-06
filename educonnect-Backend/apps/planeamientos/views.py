from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from django.utils.timezone import now
from django.http import Http404
from django.shortcuts import redirect
from cloudinary.utils import private_download_url
import os

from .models import Planeamiento
from .serializers import PlaneamientoSerializer
from apps.databaseModels.models import AuthUsuarioRol


def is_admin_user(user):
    if not user or not user.is_authenticated:
        return False

    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return True

    return AuthUsuarioRol.objects.filter(
        usuario=user,
        rol__nombre__iexact="administrador",
    ).exists()


class ViewPlaneamiento(viewsets.ModelViewSet):
    queryset = Planeamiento.objects.select_related("docente", "docente__persona", "revisado_por", "revisado_por__persona")
    serializer_class = PlaneamientoSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        base_qs = self.queryset.order_by("-creado")
        if is_admin_user(self.request.user):
            return base_qs
        return base_qs.filter(docente=self.request.user)

    def perform_create(self, serializer):
        serializer.save(docente=self.request.user)

    # ✅ POST /api/v1/planeamientos/Planeamientos/<id>/enviar/
    @action(detail=True, methods=["post"], url_path="enviar")
    def enviar(self, request, pk=None):
        plane = self.get_object()

        if plane.estado != "Borrador":
            return Response(
                {"detail": "Solo se puede enviar un planeamiento en Borrador."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not plane.archivo:
            return Response(
                {"detail": "Debes subir un archivo antes de enviar."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        plane.estado = "En revisión"
        plane.fecha_envio = now().date()
        plane.save()

        return Response(self.get_serializer(plane).data, status=status.HTTP_200_OK)

    # ✅ GET /api/v1/planeamientos/Planeamientos/<id>/archivo/
    @action(detail=True, methods=["get"], url_path="archivo")
    def archivo(self, request, pk=None):
        plane = self.get_object()

        if not plane.archivo:
            raise Http404("Este planeamiento no tiene archivo.")

        # En este proyecto Cloudinary guarda el public_id de raw incluyendo extensión.
        # Ej: media/planeamientos/planeamientos_dbsimp.pdf
        public_id_con_ext = (plane.archivo.name or "").lstrip("/")
        _, extension = os.path.splitext(public_id_con_ext)
        extension_limpia = extension.replace(".", "") or None

        download_url = None
        try:
            download_url = private_download_url(
                public_id_con_ext,
                extension_limpia,
                resource_type="raw",
                type="upload",
                attachment=True,
            )
        except Exception:
            download_url = None

        if not download_url:
            return Response(
                {"detail": "No se pudo resolver la descarga del documento en Cloudinary."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return redirect(download_url)