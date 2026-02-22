from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from apps.databaseModels.models import (
    ComitesComite,
    ComitesMiembro,
    ComitesActa,
    ComitesInformeOrgano,
    PersonasPersona,
)
from .serializers import (
    ComitesComiteSerializer,
    ComitesComiteCreateSerializer,
    ComitesMiembroSerializer,
    PersonaSimpleSerializer,
    ComitesActaSerializer,
    ComitesInformeOrganoSerializer,
)


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
    
    def get_serializer_class(self):
        """Usar serializer específico para creación"""
        if self.action == 'create':
            return ComitesComiteCreateSerializer
        return ComitesComiteSerializer
    
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
        comite = self.get_object()
        serializer = ComitesMiembroSerializer(
            data=request.data,
            context={'comite': comite}
        )
        
        if serializer.is_valid():
            serializer.save(comite=comite)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'])
    def remover_miembro(self, request, pk=None):
        """
        Remover un miembro de un comité.
        Esperado: {miembro_id}
        """
        comite = self.get_object()
        miembro_id = request.data.get('miembro_id')
        
        if not miembro_id:
            return Response(
                {'error': 'Se requiere miembro_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            miembro = ComitesMiembro.objects.get(id=miembro_id, comite=comite)
            miembro.delete()
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
                serializer.save()
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
        queryset = self.get_queryset().filter(id__in=docentes_ids)
        
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
        
        if not is_privileged:
            if not persona:
                return queryset.none()
            queryset = queryset.filter(elaborada_por=self.request.user)
            
        return queryset


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
