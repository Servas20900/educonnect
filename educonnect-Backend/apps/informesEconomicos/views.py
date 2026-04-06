from urllib.request import Request, urlopen
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.contrib.contenttypes.models import ContentType
from apps.databaseModels.models import DocumentosDocumento
from .models import PatronatoInforme
from .serializers import InformeEconomicoWriteSerializer, InformeEconomicoReadSerializer


DOWNLOAD_TIMEOUT_SECONDS = 15


def fetch_remote_file_bytes(url):
    request = Request(
        url,
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*',
        },
    )
    with urlopen(request, timeout=DOWNLOAD_TIMEOUT_SECONDS) as remote_file:
        return remote_file.read()


class PatronatoInformeViewSet(viewsets.ModelViewSet):
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
        informe = self.get_object()
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

        try:
            file_bytes = fetch_remote_file_bytes(documento.ruta_archivo)
            if not file_bytes:
                raise ValueError('Archivo vacio')
            file_response = HttpResponse(file_bytes, content_type=content_type_value)
            file_response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return file_response
        except Exception:
            return Response(
                {'error': 'No fue posible obtener el archivo del informe desde el almacenamiento.'},
                status=status.HTTP_404_NOT_FOUND,
            )