from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.http import FileResponse
from django.http import HttpResponse
from django.db.models import Count, Q
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from urllib.parse import urlparse
from cloudinary.utils import private_download_url
import os
from apps.carpetas.services import DocumentService
from apps.databaseModels.models import (
    ComitesComite,
    ComitesMiembro,
    ComitesActa,
    ComitesInformeOrgano,
    DocumentosDocumento,
    PersonasPersona,
)
from .serializers import (
    ComitesComiteSerializer,
    ComitesComiteCreateSerializer,
    ComitesMiembroSerializer,
    PersonaSimpleSerializer,
    ComitesActaSerializer,
    ComitesInformeOrganoSerializer,
    _ensure_committee_role_for_persona,
    _remove_committee_role_if_unused,
)


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


class ComitesComiteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión completa de comités.
    Permite crear, listar, actualizar y eliminar comités.
    """
    queryset = ComitesComite.objects.all().prefetch_related('comitesmiembro_set__persona')
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'tipo_comite', 'descripcion']
    ordering_fields = ['nombre', 'fecha_creacion', 'estado']
    ordering = ['-fecha_creacion']

    def _is_privileged(self, request):
        return bool(request.user and (request.user.is_staff or request.user.is_superuser))

    def _get_user_comite_ids(self, request):
        persona = getattr(request.user, 'persona', None)
        if not persona:
            return []
        return list(
            ComitesMiembro.objects.filter(persona=persona, activo=True)
            .values_list('comite_id', flat=True)
        )

    def _require_manage_permission(self, request):
        if self._is_privileged(request):
            return None
        return Response(
            {'error': 'Solo administración puede gestionar comités y sus integrantes.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    def get_serializer_class(self):
        """Usar serializer específico para creación"""
        if self.action == 'create':
            return ComitesComiteCreateSerializer
        return ComitesComiteSerializer

    def create(self, request, *args, **kwargs):
        denied = self._require_manage_permission(request)
        if denied:
            return denied
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        denied = self._require_manage_permission(request)
        if denied:
            return denied
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        denied = self._require_manage_permission(request)
        if denied:
            return denied
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        denied = self._require_manage_permission(request)
        if denied:
            return denied
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['patch'])
    def archivar(self, request, pk=None):
        denied = self._require_manage_permission(request)
        if denied:
            return denied

        comite = self.get_object()
        comite.estado = 'inactivo'
        comite.save(update_fields=['estado'])
        return Response({'message': 'Comité archivado correctamente', 'estado': comite.estado})

    @action(detail=True, methods=['patch'])
    def desarchivar(self, request, pk=None):
        denied = self._require_manage_permission(request)
        if denied:
            return denied

        comite = self.get_object()
        comite.estado = 'activo'
        comite.save(update_fields=['estado'])
        return Response({'message': 'Comité desarchivado correctamente', 'estado': comite.estado})
    
    def get_queryset(self):
        """Filtrar comités por estado si se especifica"""
        queryset = super().get_queryset()
        estado = self.request.query_params.get('estado', None)
        tipo = self.request.query_params.get('tipo_comite', None)
        mis_comites = self.request.query_params.get('mis_comites', None)
        
        if estado:
            queryset = queryset.filter(estado=estado)
        if tipo:
            queryset = queryset.filter(tipo_comite=tipo)

        if mis_comites and not self._is_privileged(self.request):
            comite_ids = self._get_user_comite_ids(self.request)
            queryset = queryset.filter(id__in=comite_ids)
            
        return queryset.annotate(
            total_miembros_activos=Count('comitesmiembro', filter=Q(comitesmiembro__activo=True))
        )
    
    @action(detail=True, methods=['post'])
    def agregar_miembro(self, request, pk=None):
        """
        Agregar un miembro a un comité existente.
        Esperado: {persona_id, cargo, fecha_nombramiento}
        """
        denied = self._require_manage_permission(request)
        if denied:
            return denied
        comite = self.get_object()
        serializer = ComitesMiembroSerializer(
            data=request.data,
            context={'comite': comite}
        )
        
        if serializer.is_valid():
            miembro = serializer.save(comite=comite)
            _ensure_committee_role_for_persona(miembro.persona, asignado_por=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'])
    def remover_miembro(self, request, pk=None):
        """
        Remover un miembro de un comité.
        Esperado: {miembro_id}
        """
        denied = self._require_manage_permission(request)
        if denied:
            return denied
        comite = self.get_object()
        miembro_id = request.data.get('miembro_id')
        
        if not miembro_id:
            return Response(
                {'error': 'Se requiere miembro_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            miembro = ComitesMiembro.objects.get(id=miembro_id, comite=comite)
            persona = miembro.persona
            miembro.delete()
            if persona:
                _remove_committee_role_if_unused(persona)
            return Response(
                {'message': 'Miembro removido exitosamente'},
                status=status.HTTP_200_OK
            )
        except ComitesMiembro.DoesNotExist:
            return Response(
                {'error': 'Miembro no encontrado en este comité'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['patch'])
    def actualizar_miembro(self, request, pk=None):
        """
        Actualizar información de un miembro del comité.
        Esperado: {miembro_id, cargo?, activo?, fecha_cese?}
        """
        denied = self._require_manage_permission(request)
        if denied:
            return denied
        comite = self.get_object()
        miembro_id = request.data.get('miembro_id')
        
        if not miembro_id:
            return Response(
                {'error': 'Se requiere miembro_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            miembro = ComitesMiembro.objects.get(id=miembro_id, comite=comite)
            serializer = ComitesMiembroSerializer(
                miembro,
                data=request.data,
                partial=True,
                context={'comite': comite}
            )
            
            if serializer.is_valid():
                miembro_actualizado = serializer.save()
                _ensure_committee_role_for_persona(miembro_actualizado.persona, asignado_por=request.user)
                return Response(serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except ComitesMiembro.DoesNotExist:
            return Response(
                {'error': 'Miembro no encontrado en este comité'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Obtener estadísticas generales de comités.
        """
        total = ComitesComite.objects.count()
        activos = ComitesComite.objects.filter(estado='activo').count()
        inactivos = ComitesComite.objects.filter(estado='inactivo').count()
        disueltos = ComitesComite.objects.filter(estado='disuelto').count()
        
        por_tipo = ComitesComite.objects.values('tipo_comite').annotate(
            total=Count('id')
        )
        
        return Response({
            'total_comites': total,
            'activos': activos,
            'inactivos': inactivos,
            'disueltos': disueltos,
            'por_tipo': list(por_tipo)
        })
    
    @action(detail=True, methods=['get'])
    def miembros_con_roles(self, request, pk=None):
        """
        Listar miembros del comité con sus roles asignados.
        """
        comite = self.get_object()
        if not self._is_privileged(request):
            comite_ids = self._get_user_comite_ids(request)
            if comite.id not in comite_ids:
                return Response({'error': 'No tienes acceso a este comité'}, status=status.HTTP_403_FORBIDDEN)
        miembros = ComitesMiembro.objects.filter(
            comite=comite,
            activo=True
        ).select_related('persona').order_by('fecha_nombramiento')
        
        serializer = ComitesMiembroSerializer(miembros, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def asignar_rol(self, request, pk=None):
        """
        Asignar o actualizar rol de un miembro en el comité.
        Esperado: {miembro_id, cargo}
        """
        denied = self._require_manage_permission(request)
        if denied:
            return denied
        comite = self.get_object()
        if not self._is_privileged(request):
            comite_ids = self._get_user_comite_ids(request)
            if comite.id not in comite_ids:
                return Response({'error': 'No tienes acceso a este comité'}, status=status.HTTP_403_FORBIDDEN)
        miembro_id = request.data.get('miembro_id')
        nuevo_cargo = request.data.get('cargo')
        
        if not miembro_id or not nuevo_cargo:
            return Response(
                {'error': 'Se requiere miembro_id y cargo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            miembro = ComitesMiembro.objects.get(id=miembro_id, comite=comite)
            
            # Usar el serializer para validar el nuevo cargo
            serializer = ComitesMiembroSerializer(
                miembro,
                data={'cargo': nuevo_cargo},
                partial=True,
                context={'comite': comite}
            )
            
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'message': f'Rol {nuevo_cargo} asignado exitosamente',
                    'data': serializer.data
                })
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except ComitesMiembro.DoesNotExist:
            return Response(
                {'error': 'Miembro no encontrado en este comité'},
                status=status.HTTP_404_NOT_FOUND
            )


class ComitesMiembroViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de miembros de comités.
    """
    queryset = ComitesMiembro.objects.all().select_related('comite', 'persona')
    serializer_class = ComitesMiembroSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['persona__nombre', 'persona__primer_apellido', 'cargo']
    ordering_fields = ['fecha_nombramiento', 'cargo']
    ordering = ['-fecha_nombramiento']

    def _require_manage_permission(self, request):
        if bool(request.user and (request.user.is_staff or request.user.is_superuser)):
            return None
        return Response(
            {'error': 'Solo administración puede modificar integrantes de comités.'},
            status=status.HTTP_403_FORBIDDEN
        )

    def create(self, request, *args, **kwargs):
        denied = self._require_manage_permission(request)
        if denied:
            return denied
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        denied = self._require_manage_permission(request)
        if denied:
            return denied
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        denied = self._require_manage_permission(request)
        if denied:
            return denied
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        denied = self._require_manage_permission(request)
        if denied:
            return denied
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        miembro = serializer.save()
        _ensure_committee_role_for_persona(miembro.persona, asignado_por=self.request.user)

    def perform_update(self, serializer):
        miembro = serializer.save()
        _ensure_committee_role_for_persona(miembro.persona, asignado_por=self.request.user)

    def perform_destroy(self, instance):
        persona = instance.persona
        super().perform_destroy(instance)
        if persona:
            _remove_committee_role_if_unused(persona)
    
    def get_queryset(self):
        """Filtrar miembros por comité si se especifica"""
        queryset = super().get_queryset()
        comite_id = self.request.query_params.get('comite_id', None)
        activo = self.request.query_params.get('activo', None)
        
        if comite_id:
            queryset = queryset.filter(comite_id=comite_id)
        if activo is not None:
            activo_bool = activo.lower() == 'true'
            queryset = queryset.filter(activo=activo_bool)
            
        return queryset


class PersonasDisponiblesViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para listar personas disponibles
    para ser agregadas a comités.
    """
    queryset = PersonasPersona.objects.all()
    serializer_class = PersonaSimpleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'primer_apellido', 'segundo_apellido', 'email']
    ordering = ['primer_apellido', 'nombre']
    
    @action(detail=False, methods=['get'])
    def docentes(self, request):
        """Listar solo personas que son docentes"""
        # Filtrar personas que tienen un registro en PersonasDocente
        from apps.databaseModels.models import PersonasDocente
        docentes_ids = PersonasDocente.objects.values_list('persona_id', flat=True)
        queryset = self.get_queryset().filter(
            id__in=docentes_ids,
            email_institucional__iendswith='@mep.go.cr'
        )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ComitesActaViewSet(viewsets.ModelViewSet):
    queryset = ComitesActa.objects.all().select_related('reunion', 'elaborada_por', 'aprobada_por')
    serializer_class = ComitesActaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['numero_acta', 'contenido', 'acuerdos', 'seguimientos']
    ordering_fields = ['fecha_elaboracion', 'numero_acta', 'estado']
    ordering = ['-fecha_elaboracion']
    
    def get_queryset(self):
        """Filtrar actas por comité si se especifica"""
        queryset = super().get_queryset()
        persona = getattr(self.request.user, 'persona', None)
        is_privileged = bool(self.request.user and (self.request.user.is_staff or self.request.user.is_superuser))
        estado = self.request.query_params.get('estado', None)

        if estado:
            queryset = queryset.filter(estado__iexact=estado)
        
        if not is_privileged:
            if not persona:
                return queryset.none()
            queryset = queryset.filter(elaborada_por=self.request.user)
            
        return queryset

    @action(detail=True, methods=['patch'])
    def archivar(self, request, pk=None):
        acta = self.get_object()
        acta.estado = 'Archivado'
        acta.save(update_fields=['estado'])
        return Response({'message': 'Acta archivada correctamente', 'estado': acta.estado})

    @action(detail=True, methods=['patch'])
    def desarchivar(self, request, pk=None):
        acta = self.get_object()
        if str(acta.estado or '').lower() == 'archivado':
            acta.estado = 'borrador'
            acta.save(update_fields=['estado'])
        return Response({'message': 'Acta desarchivada correctamente', 'estado': acta.estado})

    @action(detail=True, methods=['post'])
    def compartir(self, request, pk=None):
        acta = self.get_object()
        archivo = request.FILES.get('file') or request.FILES.get('archivo')
        if not archivo:
            return Response(
                {'error': "No se proporcionó ningún archivo en la llave 'file' o 'archivo'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            doc = DocumentService.procesar_subida(
                archivo=archivo,
                objeto_destino=acta,
                usuario=request.user,
                descripcion=f"Acta oficial número {acta.numero_acta}",
            )
            return Response(
                {
                    'message': 'Acta compartida exitosamente',
                    'documento_id': doc.id,
                    'url': doc.ruta_archivo,
                    'nombre': doc.nombre,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as exc:
            return Response(
                {'error': f'Error al procesar el archivo: {exc}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=['get'])
    def descargar(self, request, pk=None):
        acta = self.get_object()
        content_type = ContentType.objects.get_for_model(ComitesActa)
        documento = (
            DocumentosDocumento.objects.filter(
                content_type=content_type,
                object_id=acta.id,
                es_version_actual=True,
            )
            .order_by('-fecha_carga')
            .first()
        )

        if not documento or not documento.ruta_archivo:
            return Response(
                {'error': 'Esta acta no tiene archivo adjunto.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        filename = documento.nombre or f'acta_{acta.id}'
        content_type_value = documento.mime_type or 'application/octet-stream'

        # 1) Fast path: direct fetch from persisted URL.
        try:
            file_bytes = fetch_remote_file_bytes(documento.ruta_archivo)
            if file_bytes:
                file_response = HttpResponse(file_bytes, content_type=content_type_value)
                file_response['Content-Disposition'] = f'attachment; filename="{filename}"'
                return file_response
        except Exception:
            pass

        # 2) Cloudinary signed download fallback (same strategy used in circulares).
        route_value = str(documento.ruta_archivo or '').strip()
        parsed_url = urlparse(route_value)
        path_value = str(parsed_url.path or route_value).strip().replace('\\', '/').lstrip('/')

        candidate_public_ids = []

        def add_public_id(value):
            normalized = str(value or '').strip().replace('\\', '/').lstrip('/')
            if normalized and normalized not in candidate_public_ids:
                candidate_public_ids.append(normalized)

        add_public_id(path_value)

        if '/upload/' in path_value:
            after_upload = path_value.split('/upload/', 1)[1].lstrip('/')
            add_public_id(after_upload)

            parts = after_upload.split('/')
            if parts and parts[0].startswith('v') and parts[0][1:].isdigit():
                add_public_id('/'.join(parts[1:]))

        if '.' in path_value:
            add_public_id(path_value.rsplit('.', 1)[0])

        extension_candidates = []
        if documento.extension:
            extension_candidates.append(str(documento.extension).lstrip('.').lower())
        if '.' in path_value:
            extension_candidates.append(path_value.rsplit('.', 1)[1].lower())
        extension_candidates.append(None)

        unique_extensions = []
        for ext in extension_candidates:
            if ext not in unique_extensions:
                unique_extensions.append(ext)

        candidate_pairs = [
            ('raw', 'upload'),
            ('raw', 'authenticated'),
            ('image', 'upload'),
            ('image', 'authenticated'),
        ]

        for public_id in candidate_public_ids:
            for fmt in unique_extensions:
                for resource_type, delivery_type in candidate_pairs:
                    try:
                        signed_url = private_download_url(
                            public_id=public_id,
                            format=fmt,
                            resource_type=resource_type,
                            type=delivery_type,
                            attachment=True,
                        )
                        file_bytes = fetch_remote_file_bytes(signed_url)
                        if file_bytes:
                            file_response = HttpResponse(file_bytes, content_type=content_type_value)
                            file_response['Content-Disposition'] = f'attachment; filename="{filename}"'
                            return file_response
                    except (HTTPError, URLError, Exception):
                        continue

        # 3) Local MEDIA_ROOT fallback for legacy/local files.
        local_candidates = []
        local_candidates.append(path_value)
        if path_value.startswith('media/'):
            local_candidates.append(path_value[len('media/'):])
        if '/' in path_value:
            local_candidates.append(path_value.split('/')[-1])

        for rel_path in local_candidates:
            absolute_path = os.path.join(settings.MEDIA_ROOT, rel_path)
            if os.path.exists(absolute_path) and os.path.isfile(absolute_path):
                try:
                    file_stream = open(absolute_path, 'rb')
                    file_response = FileResponse(file_stream, as_attachment=True)
                    file_response['Content-Disposition'] = f'attachment; filename="{filename}"'
                    return file_response
                except Exception:
                    continue

        return Response(
            {'error': 'No fue posible obtener el archivo del acta desde el almacenamiento.'},
            status=status.HTTP_404_NOT_FOUND,
        )


class ComitesInformeOrganoViewSet(viewsets.ModelViewSet):
    queryset = ComitesInformeOrgano.objects.all().select_related('organo', 'periodo', 'elaborado_por')
    serializer_class = ComitesInformeOrganoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['tipo_informe', 'titulo', 'contenido', 'conclusiones', 'recomendaciones']
    ordering_fields = ['fecha_elaboracion', 'fecha_presentacion', 'titulo', 'estado']
    ordering = ['-fecha_elaboracion']

    def get_queryset(self):
        """Filtrar reportes por comité si se especifica"""
        queryset = super().get_queryset().filter(tipo_informe='reporte_comite')
        persona = getattr(self.request.user, 'persona', None)
        is_privileged = bool(self.request.user and (self.request.user.is_staff or self.request.user.is_superuser))

        if not is_privileged:
            if not persona:
                return queryset.none()
            queryset = queryset.filter(elaborado_por=self.request.user)

        return queryset
