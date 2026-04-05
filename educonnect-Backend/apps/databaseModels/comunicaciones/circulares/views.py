import os

from django.db.models import Case, IntegerField, Value, When
from django.http import FileResponse, HttpResponse
from rest_framework import permissions, response, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from django.conf import settings
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from cloudinary.utils import private_download_url

from apps.databaseModels.comunicaciones.circulares.serializers import (
    ReadSerializerComunicacionesCircular,
    WriteSerializerComunicacionesCircular,
)
from apps.databaseModels.models import ComunicacionesCircular


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


class ViewComunicacionesCircular(viewsets.ModelViewSet):
    queryset = ComunicacionesCircular.objects.annotate(
        prioridad_estado=Case(
            When(estado='Publicado', then=Value(1)),
            When(estado='Borrador', then=Value(2)),
            When(estado='Inactivo', then=Value(3)),
            default=Value(4),
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
        if instance.estado != 'Inactivo':
            instance.estado = 'Borrador'
        else:
            instance.estado = 'Inactivo'

        instance.save()
        return response.Response(
            {'message': f"Circular '{instance.titulo}' marcada como inactiva."},
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

        filename = instance.archivo_adjunto.name.split('/')[-1]

        try:
            file_stream = instance.archivo_adjunto.open('rb')
            file_response = FileResponse(file_stream, as_attachment=True)
            file_response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return file_response
        except Exception:
            pass

        try:
            file_stream = instance.archivo_adjunto.storage.open(instance.archivo_adjunto.name, 'rb')
            file_response = FileResponse(file_stream, as_attachment=True)
            file_response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return file_response
        except Exception:
            pass

        try:
            file_url = instance.archivo_adjunto.url
            file_bytes = fetch_remote_file_bytes(file_url)
            file_response = HttpResponse(file_bytes, content_type='application/octet-stream')
            file_response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return file_response
        except Exception:
            pass

        full_name = str(instance.archivo_adjunto.name or '').strip().replace('\\', '/').lstrip('/')
        candidate_names = []

        def add_candidate_name(path_value):
            normalized = str(path_value or '').strip().replace('\\', '/').lstrip('/')
            if normalized and normalized not in candidate_names:
                candidate_names.append(normalized)

        add_candidate_name(full_name)
        if full_name.startswith('media/'):
            add_candidate_name(full_name[len('media/'):])

        add_candidate_name(full_name.replace('/media/', '/'))
        add_candidate_name(full_name.replace('home/circular/', 'home/media/circular/'))
        add_candidate_name(full_name.replace('home/media/circular/', 'home/circular/'))

        if '/' in full_name:
            add_candidate_name(full_name.split('/')[-1])

        candidate_public_ids = []

        def add_public_id(value):
            normalized = str(value or '').strip().replace('\\', '/').lstrip('/')
            if normalized and normalized not in candidate_public_ids:
                candidate_public_ids.append(normalized)

        for candidate in candidate_names:
            if not candidate:
                continue

            # Cloudinary raw can store public_id with extension (e.g. *.pdf), so keep full candidate too.
            add_public_id(candidate)
            if candidate.startswith('media/'):
                add_public_id(candidate[len('media/'):])

            add_public_id(candidate.replace('/media/', '/'))
            add_public_id(candidate.replace('home/circular/', 'home/media/circular/'))
            add_public_id(candidate.replace('home/media/circular/', 'home/circular/'))

            if '/' in candidate:
                add_public_id(candidate.split('/')[-1])

            if '.' in candidate:
                public_id = candidate.rsplit('.', 1)[0]
            else:
                public_id = candidate

            add_public_id(public_id)

            # Some records may include a leading media segment that is not part of Cloudinary public_id.
            if public_id.startswith('media/'):
                add_public_id(public_id[len('media/'):])

            add_public_id(public_id.replace('/media/', '/'))
            add_public_id(public_id.replace('home/circular/', 'home/media/circular/'))
            add_public_id(public_id.replace('home/media/circular/', 'home/circular/'))

            if '/' in public_id:
                add_public_id(public_id.split('/')[-1])

        unique_public_ids = []
        seen_public_ids = set()
        for pid in candidate_public_ids:
            if pid and pid not in seen_public_ids:
                seen_public_ids.add(pid)
                unique_public_ids.append(pid)

        format_candidates = []
        for candidate in candidate_names:
            if '.' in candidate:
                format_candidates.append(candidate.rsplit('.', 1)[1].lower())

        # Keep format attempts narrow: actual extension first, then no-format fallback.
        format_candidates.append(None)

        unique_formats = []
        seen_formats = set()
        for fmt in format_candidates:
            key = str(fmt)
            if key not in seen_formats:
                seen_formats.add(key)
                unique_formats.append(fmt)

        # Use a bounded strategy: resource/type combinations most likely to work.
        candidate_pairs = [
            ('raw', 'upload'),
            ('raw', 'authenticated'),
            ('image', 'upload'),
            ('image', 'authenticated'),
        ]

        max_signed_attempts = 256
        signed_attempts = 0

        for public_id in unique_public_ids:
            for fmt in unique_formats:
                for resource_type, delivery_type in candidate_pairs:
                    signed_attempts += 1
                    if signed_attempts > max_signed_attempts:
                        break
                    try:
                        signed_download_url = private_download_url(
                            public_id=public_id,
                            format=fmt,
                            resource_type=resource_type,
                            type=delivery_type,
                            attachment=True,
                        )
                        file_bytes = fetch_remote_file_bytes(signed_download_url)
                        file_response = HttpResponse(file_bytes, content_type='application/octet-stream')
                        file_response['Content-Disposition'] = f'attachment; filename="{filename}"'
                        return file_response
                    except (HTTPError, URLError, Exception):
                        continue
                if signed_attempts > max_signed_attempts:
                    break
            if signed_attempts > max_signed_attempts:
                break

        # Final fallback: serve from local MEDIA_ROOT for legacy files not present in Cloudinary.
        local_relative_candidates = []
        for candidate in candidate_names:
            if not candidate:
                continue
            local_relative_candidates.append(candidate)
            if candidate.startswith('media/'):
                local_relative_candidates.append(candidate[len('media/'):])
            if '/' in candidate:
                local_relative_candidates.append(candidate.split('/')[-1])

        unique_local_relatives = []
        seen_local_relatives = set()
        for rel in local_relative_candidates:
            normalized = str(rel).replace('\\', '/').lstrip('/')
            if normalized and normalized not in seen_local_relatives:
                seen_local_relatives.add(normalized)
                unique_local_relatives.append(normalized)

        for rel_path in unique_local_relatives:
            absolute_path = os.path.join(settings.MEDIA_ROOT, rel_path)
            if os.path.exists(absolute_path) and os.path.isfile(absolute_path):
                try:
                    file_stream = open(absolute_path, 'rb')
                    file_response = FileResponse(file_stream, as_attachment=True)
                    file_response['Content-Disposition'] = f'attachment; filename="{filename}"'
                    return file_response
                except Exception:
                    continue

        return response.Response(
            {'error': 'Archivo no encontrado en el almacenamiento remoto.'},
            status=status.HTTP_404_NOT_FOUND,
        )
