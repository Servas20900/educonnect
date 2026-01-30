from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from apps.databaseModels.models import ComitesComite, ComitesMiembro, PersonasPersona
from .serializers import (
    ComitesComiteSerializer,
    ComitesComiteCreateSerializer,
    ComitesMiembroSerializer,
    PersonaSimpleSerializer
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
        
        if estado:
            queryset = queryset.filter(estado=estado)
        if tipo:
            queryset = queryset.filter(tipo_comite=tipo)
            
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
