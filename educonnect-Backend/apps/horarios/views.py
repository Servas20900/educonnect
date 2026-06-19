from rest_framework import viewsets, permissions, response, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from apps.databaseModels.models import HorariosHorario, AuthUsuarioRol, DocumentosDocumento
from .serializers import ReadSerializerHorariosHorario, WriteSerializerHorariosHorario
from django.db.models import Case, Value, When, IntegerField
from django.contrib.contenttypes.models import ContentType
from django.http import HttpResponse
from core.views import obtener_rol_usuario
from core.permissions import IsAdmin, IsDocenteOrAdmin
from apps.carpetas.views import (
    _urls_descarga_documento,
    _descargar_remoto,
    _nombre_descarga_documento,
    _leer_archivo_local,
)
from cloudinary.utils import cloudinary_url as cloudinary_build_url
from urllib.error import HTTPError, URLError
from urllib.parse import quote
import unicodedata


def _normalizar_nombre_rol(valor):
    limpio = unicodedata.normalize('NFKD', str(valor or ''))
    limpio = ''.join(ch for ch in limpio if not unicodedata.combining(ch))
    return limpio.strip().lower()


def _to_bool(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {'1', 'true', 't', 'yes', 'y', 'si'}

class ViewHorariosHorario(viewsets.ModelViewSet):
    permission_classes = [IsDocenteOrAdmin]

    def _base_queryset(self):
        return HorariosHorario.objects.select_related('docente', 'creado_por').annotate(
            prioridad_estado=Case(
                When(estado="Publicado", then=Value(1)),
                When(estado="Borrador", then=Value(2)),
                When(estado="Archivado", then=Value(3)),
                When(estado="Inactivo", then=Value(3)),
                default=Value(4),
                output_field=IntegerField(),
            )
        ).order_by('prioridad_estado', '-fecha_creacion')

    def _es_admin(self, user):
        if getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False):
            return True

        nombres_roles = AuthUsuarioRol.objects.filter(usuario=user).values_list('rol__nombre', flat=True)
        aliases_admin = {'administrador', 'administracion', 'admin'}
        return any(_normalizar_nombre_rol(nombre) in aliases_admin for nombre in nombres_roles)

    def get_queryset(self):
        qs = self._base_queryset()
        user = self.request.user

        estado = self.request.query_params.get('estado')
        archivados_only = _to_bool(self.request.query_params.get('archivados_only'))
        exclude_archivados = _to_bool(self.request.query_params.get('exclude_archivados'))

        if self._es_admin(user):
            if archivados_only:
                qs = qs.filter(estado='Archivado')
            elif estado:
                qs = qs.filter(estado=estado)
            elif exclude_archivados:
                qs = qs.exclude(estado='Archivado')
            return qs

        rol = obtener_rol_usuario(user)
        if rol == 'docente':
            return qs.filter(docente__persona__authusuario=user, estado='Publicado')

        return qs.none()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WriteSerializerHorariosHorario
        return ReadSerializerHorariosHorario

    def perform_create(self, serializer):
        if not self._es_admin(self.request.user):
            raise PermissionDenied('Solo administración puede crear horarios.')
        serializer.save(creado_por=self.request.user, estado='Publicado')

    def perform_update(self, serializer):
        if not self._es_admin(self.request.user):
            raise PermissionDenied('Solo administración puede editar horarios.')
        extra = {}
        if 'estado' not in serializer.validated_data:
            extra['estado'] = 'Publicado'
        serializer.save(**extra)

    def destroy(self, request, *args, **kwargs):
        if not self._es_admin(request.user):
            raise PermissionDenied('Solo administración puede eliminar horarios.')
        instance = self.get_object()
        instance.estado = 'Archivado'
        instance.save(update_fields=['estado'])
        return response.Response(
            {"message": f"El horario '{instance.nombre}' ha sido archivado."},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['patch'], url_path='restaurar')
    def restaurar(self, request, pk=None):
        if not self._es_admin(request.user):
            raise PermissionDenied('Solo administración puede restaurar horarios.')
        try:
            instance = HorariosHorario.objects.get(pk=pk)
        except HorariosHorario.DoesNotExist:
            return response.Response({'error': 'Horario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        instance.estado = 'Publicado'
        instance.save(update_fields=['estado'])
        return response.Response(
            {"message": f"El horario '{instance.nombre}' ha sido restaurado."},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['get'], url_path='documento')
    def documento(self, request, pk=None):
        try:
            horario = HorariosHorario.objects.get(pk=pk)
        except HorariosHorario.DoesNotExist:
            return response.Response({'error': 'Horario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        ct = ContentType.objects.get_for_model(HorariosHorario)
        doc = DocumentosDocumento.objects.filter(
            content_type=ct,
            object_id=horario.id,
            es_version_actual=True,
        ).order_by('-fecha_carga').first()

        if not doc or not doc.ruta_archivo:
            return response.Response({'error': 'No hay documento adjunto.'}, status=status.HTTP_404_NOT_FOUND)

        content, remote_content_type = _leer_archivo_local(doc)
        errores = []

        if not content:
            for url in _urls_descarga_documento(doc):
                try:
                    content, remote_content_type = _descargar_remoto(url)
                    break
                except HTTPError as e:
                    errores.append(f'{url} -> HTTPError {e.code}')
                except URLError as e:
                    errores.append(f'{url} -> URLError {e}')
                except Exception as e:
                    errores.append(f'{url} -> {type(e).__name__}: {e}')

        if not content:
            public_id = str((doc.metadatos or {}).get('public_id') or '').strip()
            extension = str(doc.extension or '').strip().lstrip('.') or 'pdf'
            if public_id:
                try:
                    import cloudinary
                    from cloudinary.utils import private_download_url
                    from django.conf import settings as django_settings
                    cld_conf = getattr(django_settings, 'CLOUDINARY_STORAGE', {})
                    cloud_name = cld_conf.get('CLOUD_NAME', '')
                    api_key = cld_conf.get('API_KEY', '')
                    api_secret = cld_conf.get('API_SECRET', '')
                    if cloud_name and api_key and api_secret:
                        cloudinary.config(cloud_name=cloud_name, api_key=api_key, api_secret=api_secret, secure=True)
                        dl_url = private_download_url(
                            public_id, extension,
                            resource_type='raw', type='upload',
                            cloud_name=cloud_name, api_key=api_key, api_secret=api_secret,
                        )
                        content, remote_content_type = _descargar_remoto(dl_url)
                except Exception as e:
                    errores.append(f'private_download_url -> {e}')

        if not content:
            return response.Response(
                {'error': 'No se pudo obtener el archivo.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        nombre = _nombre_descarga_documento(doc)
        encoded = quote(nombre)
        http_response = HttpResponse(
            content,
            content_type=doc.mime_type or remote_content_type or 'application/octet-stream',
        )
        http_response['Content-Disposition'] = f"attachment; filename=\"{nombre}\"; filename*=UTF-8''{encoded}"
        return http_response