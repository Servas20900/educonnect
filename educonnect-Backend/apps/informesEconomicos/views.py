from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.contrib.contenttypes.models import ContentType
from urllib.parse import quote
from apps.databaseModels.models import DocumentosDocumento
from apps.carpetas.views import _descargar_remoto
from .models import PatronatoInforme
from .serializers import InformeEconomicoWriteSerializer, InformeEconomicoReadSerializer
from core.permissions import IsAuthenticated, IsAdmin, IsAuxiliarUser
from core.responses import success_response, created_response, error_response


class PatronatoInformeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuxiliarUser]
    queryset = PatronatoInforme.objects.all().order_by('-fecha_creacion')

    def get_queryset(self):
        queryset = super().get_queryset()
        include_archived = str(self.request.query_params.get('include_archived', '')).lower() == 'true'
        categoria = str(self.request.query_params.get('categoria', '')).strip().lower()

        if categoria:
            queryset = queryset.filter(categoria__iexact=categoria)

        if include_archived:
            return queryset

        return queryset.exclude(estado__iexact='archivado')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return InformeEconomicoWriteSerializer
        return InformeEconomicoReadSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        informe = serializer.save()

        read_serializer = InformeEconomicoReadSerializer(informe)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def archivar(self, request, pk=None):
        informe = self.get_object()
        informe.estado = 'Archivado'
        informe.save(update_fields=['estado'])
        serializer = InformeEconomicoReadSerializer(informe)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'])
    def desarchivar(self, request, pk=None):
        try:
            informe = PatronatoInforme.objects.get(pk=pk)
        except PatronatoInforme.DoesNotExist:
            return Response({'error': 'Informe no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        informe.estado = 'Activo'
        informe.save(update_fields=['estado'])
        serializer = InformeEconomicoReadSerializer(informe)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def descargar(self, request, pk=None):
        informe = self.get_object()
        content_type = ContentType.objects.get_for_model(PatronatoInforme)
        documento = (
            DocumentosDocumento.objects.filter(
                content_type=content_type,
                object_id=informe.id,
                es_version_actual=True,
            )
            .order_by('-fecha_carga')
            .first()
        )

        if not documento or not documento.ruta_archivo:
            return Response(
                {'error': 'Este informe no tiene archivo adjunto.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        filename = documento.nombre or f'informe_{informe.id}'
        content_type_value = documento.mime_type or 'application/octet-stream'
        content = None

        # Intento 1: URL directa (funciona en desarrollo local)
        try:
            content, ct = _descargar_remoto(documento.ruta_archivo)
            if content:
                content_type_value = ct or content_type_value
        except Exception:
            pass

        # Intento 2: Cloudinary via private_download_url (para access_mode=authenticated)
        if not content:
            try:
                import cloudinary
                from cloudinary.utils import private_download_url
                from django.conf import settings as django_settings
                import os
                cld_conf = getattr(django_settings, 'CLOUDINARY_STORAGE', {})
                cloud_name = cld_conf.get('CLOUD_NAME', '')
                api_key = cld_conf.get('API_KEY', '')
                api_secret = cld_conf.get('API_SECRET', '')
                metadatos = documento.metadatos or {}
                public_id = metadatos.get('public_id') or ''
                resource_type = metadatos.get('resource_type') or 'raw'
                if cloud_name and api_key and api_secret and public_id:
                    cloudinary.config(cloud_name=cloud_name, api_key=api_key, api_secret=api_secret, secure=True)
                    ext = os.path.splitext(filename)[1].lstrip(".") or "pdf"
                    dl_url = private_download_url(
                        public_id, ext,
                        resource_type=resource_type, type='upload',
                        cloud_name=cloud_name, api_key=api_key, api_secret=api_secret,
                    )
                    content, ct = _descargar_remoto(dl_url)
                    if content:
                        content_type_value = ct or content_type_value
            except Exception:
                pass

        if not content:
            return Response(
                {'error': 'No fue posible obtener el archivo del informe desde el almacenamiento.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        encoded = quote(filename)
        file_response = HttpResponse(content, content_type=content_type_value)
        file_response['Content-Disposition'] = f'attachment; filename="{filename}"; filename*=UTF-8\'\'{encoded}'
        return file_response