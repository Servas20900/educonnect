from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from django.utils.timezone import now
from django.http import FileResponse, Http404, HttpResponse
from urllib.parse import quote
from apps.carpetas.views import _descargar_remoto
import os
import logging

logger = logging.getLogger(__name__)

from .models import Planeamiento
from .serializers import PlaneamientoSerializer
from core.permissions import IsDocenteOrAdmin
from core.utils import user_is_admin
from core.responses import success_response, error_response


class ViewPlaneamiento(viewsets.ModelViewSet):
    queryset = Planeamiento.objects.select_related("docente", "docente__persona", "revisado_por", "revisado_por__persona")
    serializer_class = PlaneamientoSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.estado = "Archivado"
        instance.save(update_fields=["estado"])
        return Response(
            {"message": f"Planeamiento '{instance.titulo}' archivado correctamente."},
            status=status.HTTP_200_OK,
        )
    permission_classes = [IsDocenteOrAdmin]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        base_qs = self.queryset.order_by("-creado")
        if user_is_admin(self.request.user):
            return base_qs
        return base_qs.filter(docente=self.request.user)

    def perform_create(self, serializer):
        serializer.save(docente=self.request.user)

    # ✅ POST /api/v1/planeamientos/Planeamientos/<id>/enviar/
    @action(detail=True, methods=["post"], url_path="enviar")
    def enviar(self, request, pk=None):
        plane = self.get_object()

        if plane.estado != "Borrador":
            return error_response("Solo se puede enviar un planeamiento en Borrador.")

        if not plane.archivo:
            return error_response("Debes subir un archivo antes de enviar.")

        plane.estado = "En revisión"
        plane.fecha_envio = now().date()
        plane.save()

        return success_response(self.get_serializer(plane).data, "Planeamiento enviado a revisión.")

    # ✅ GET /api/v1/planeamientos/Planeamientos/<id>/archivo/
    @action(detail=True, methods=["get"], url_path="archivo")
    def archivo(self, request, pk=None):
        plane = self.get_object()

        if not plane.archivo:
            raise Http404("Este planeamiento no tiene archivo.")

        from django.conf import settings as django_settings
        import mimetypes

        raw_name = str(plane.archivo.name or "").replace("\\", "/").strip("/")
        nombre = os.path.basename(raw_name) or "planeamiento"
        content = None
        content_type = "application/octet-stream"

        # Intento 1: filesystem local
        media_root = str(getattr(django_settings, 'MEDIA_ROOT', '') or '').rstrip('/')
        rutas_locales = []
        if media_root:
            rutas_locales.append(os.path.join(media_root, raw_name))
            if raw_name.startswith("media/"):
                rutas_locales.append(os.path.join(media_root, raw_name[len("media/"):]))
            rutas_locales.append(os.path.join(media_root, "media", raw_name))
        rutas_locales.append("/" + raw_name)

        for ruta in rutas_locales:
            try:
                if os.path.isfile(ruta):
                    with open(ruta, "rb") as f:
                        content = f.read()
                    content_type = mimetypes.guess_type(ruta)[0] or "application/octet-stream"
                    break
            except Exception:
                pass

        # Intento 2: Cloudinary — el archivo existe con access_mode=authenticated,
        # por lo que hay que descargarlo vía API endpoint (no CDN URL).
        if not content:
            try:
                import cloudinary
                import cloudinary.api
                from cloudinary.utils import private_download_url

                cld_conf = getattr(django_settings, 'CLOUDINARY_STORAGE', {})
                cloud_name = cld_conf.get('CLOUD_NAME', '')
                api_key = cld_conf.get('API_KEY', '')
                api_secret = cld_conf.get('API_SECRET', '')

                if cloud_name and api_key and api_secret:
                    cloudinary.config(
                        cloud_name=cloud_name,
                        api_key=api_key,
                        api_secret=api_secret,
                        secure=True,
                    )

                    clean_name = raw_name[len("media/"):] if raw_name.startswith("media/") else raw_name
                    ext = os.path.splitext(raw_name)[1].lstrip(".") or "pdf"

                    # Probar los dos public_ids posibles (con y sin prefijo media/)
                    for public_id in [raw_name, clean_name]:
                        try:
                            # private_download_url genera URL de descarga vía API autenticada
                            # (https://api.cloudinary.com/v1_1/.../raw/download?...)
                            # que sí puede servir archivos con access_mode=authenticated
                            dl_url = private_download_url(
                                public_id, ext,
                                resource_type='raw',
                                type='upload',
                                cloud_name=cloud_name,
                                api_key=api_key,
                                api_secret=api_secret,
                            )
                            content, ct = _descargar_remoto(dl_url)
                            if content:
                                content_type = ct or content_type
                                break
                        except Exception:
                            pass

            except Exception:
                pass

        if not content:
            return error_response(
                "No fue posible obtener el documento adjunto.",
                code="not_found",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        encoded = quote(nombre)
        http_response = HttpResponse(content, content_type=content_type)
        http_response["Content-Disposition"] = f'attachment; filename="{nombre}"; filename*=UTF-8\'\'{encoded}'
        return http_response

    @action(detail=True, methods=["post"], url_path="desarchivar")
    def desarchivar(self, request, pk=None):
        plane = self.get_object()

        if plane.estado != "Archivado":
            return error_response(f"Solo se puede desarchivar un planeamiento archivado (estado actual: {plane.estado}).")

        plane.estado = "Borrador"
        plane.save(update_fields=["estado"])

        return success_response(self.get_serializer(plane).data, "Planeamiento restaurado a Borrador.")

    @action(detail=True, methods=["post"], url_path="aprobar")
    def aprobar(self, request, pk=None):
        if not user_is_admin(request.user):
            return error_response("Solo administración puede aprobar planeamientos.", status_code=status.HTTP_403_FORBIDDEN)

        comentario = (request.data.get("comentario") or "").strip()
        if not comentario:
            return error_response("El comentario es obligatorio para aprobar.")

        plane = self.get_object()
        if plane.estado not in ("En revisión", "Borrador"):
            return error_response(f"No se puede aprobar un planeamiento en estado '{plane.estado}'.")

        plane.estado = "Aprobado"
        plane.comentario_revision = comentario
        plane.revisado_por = request.user
        plane.fecha_revision = now()
        plane.save(update_fields=["estado", "comentario_revision", "revisado_por", "fecha_revision"])

        return success_response(self.get_serializer(plane).data, "Planeamiento aprobado.")

    @action(detail=True, methods=["post"], url_path="rechazar")
    def rechazar(self, request, pk=None):
        if not user_is_admin(request.user):
            return error_response("Solo administración puede rechazar planeamientos.", status_code=status.HTTP_403_FORBIDDEN)

        comentario = (request.data.get("comentario") or "").strip()
        if not comentario:
            return error_response("El comentario es obligatorio para rechazar.")

        plane = self.get_object()
        if plane.estado not in ("En revisión", "Borrador"):
            return error_response(f"No se puede rechazar un planeamiento en estado '{plane.estado}'.")

        plane.estado = "Borrador"
        plane.comentario_revision = comentario
        plane.revisado_por = request.user
        plane.fecha_revision = now()
        plane.save(update_fields=["estado", "comentario_revision", "revisado_por", "fecha_revision"])

        return success_response(self.get_serializer(plane).data, "Planeamiento rechazado y devuelto a Borrador.")