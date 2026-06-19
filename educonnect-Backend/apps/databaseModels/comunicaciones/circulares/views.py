import os
import mimetypes
from urllib.parse import quote

from django.db.models import Case, IntegerField, Value, When
from django.http import HttpResponse
from rest_framework import permissions, response, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from django.conf import settings

from apps.databaseModels.comunicaciones.circulares.serializers import (
    ReadSerializerComunicacionesCircular,
    WriteSerializerComunicacionesCircular,
)
from apps.databaseModels.models import ComunicacionesCircular
from apps.carpetas.views import _descargar_remoto


class ViewComunicacionesCircular(viewsets.ModelViewSet):
    queryset = ComunicacionesCircular.objects.select_related('creada_por').annotate(
        prioridad_estado=Case(
            When(estado='activa', then=Value(1)),
            When(estado='archivada', then=Value(2)),
            default=Value(3),
            output_field=IntegerField(),
        )
    ).order_by('prioridad_estado', '-fecha_creacion')
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WriteSerializerComunicacionesCircular
        return ReadSerializerComunicacionesCircular

    def perform_create(self, serializer):
        serializer.save(creada_por=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.estado = 'archivada'
        instance.save(update_fields=['estado'])
        return response.Response(
            {'message': f"Circular '{instance.titulo}' archivada correctamente."},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['patch'], url_path='restaurar')
    def restaurar(self, request, pk=None):
        instance = self.get_object()
        instance.estado = 'activa'
        instance.save(update_fields=['estado'])
        return response.Response(
            {'message': f"Circular '{instance.titulo}' restaurada correctamente."},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['get'], url_path='descargar')
    def descargar(self, request, pk=None):
        instance = self.get_object()

        if not instance.archivo_adjunto:
            return response.Response(
                {'error': 'Esta circular no tiene archivo adjunto.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        raw_name = str(instance.archivo_adjunto.name or '').replace('\\', '/').strip('/')
        nombre = raw_name.split('/')[-1] or 'circular'
        content = None
        content_type = 'application/octet-stream'

        # Intento 1: filesystem local
        media_root = str(getattr(settings, 'MEDIA_ROOT', '') or '').rstrip('/')
        rutas_locales = []
        if media_root:
            rutas_locales.append(os.path.join(media_root, raw_name))
            if raw_name.startswith('media/'):
                rutas_locales.append(os.path.join(media_root, raw_name[len('media/'):]))
            rutas_locales.append(os.path.join(media_root, 'media', raw_name))
        rutas_locales.append('/' + raw_name)
        for ruta in rutas_locales:
            try:
                if os.path.isfile(ruta):
                    with open(ruta, 'rb') as f:
                        content = f.read()
                    content_type = mimetypes.guess_type(ruta)[0] or 'application/octet-stream'
                    break
            except Exception:
                pass

        # Intento 2: Cloudinary via private_download_url (API auth, bypasa access_mode=authenticated)
        if not content:
            try:
                import cloudinary
                from cloudinary.utils import private_download_url
                cld_conf = getattr(settings, 'CLOUDINARY_STORAGE', {})
                cloud_name = cld_conf.get('CLOUD_NAME', '')
                api_key = cld_conf.get('API_KEY', '')
                api_secret = cld_conf.get('API_SECRET', '')
                if cloud_name and api_key and api_secret:
                    cloudinary.config(cloud_name=cloud_name, api_key=api_key, api_secret=api_secret, secure=True)
                    clean_name = raw_name[len('media/'):] if raw_name.startswith('media/') else raw_name
                    ext = os.path.splitext(raw_name)[1].lstrip('.') or 'pdf'
                    for public_id in [raw_name, clean_name]:
                        try:
                            dl_url = private_download_url(
                                public_id, ext,
                                resource_type='raw', type='upload',
                                cloud_name=cloud_name, api_key=api_key, api_secret=api_secret,
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
            return response.Response(
                {'error': 'Archivo no encontrado en el almacenamiento remoto.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        encoded = quote(nombre)
        http_response = HttpResponse(content, content_type=content_type)
        http_response['Content-Disposition'] = f'attachment; filename="{nombre}"; filename*=UTF-8\'\'{encoded}'
        return http_response
