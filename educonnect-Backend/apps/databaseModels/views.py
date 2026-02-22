from django.shortcuts import render
from .serializers import *
from rest_framework import viewsets, permissions, status, response, filters
from .models import * 
from rest_framework.views import APIView
from django.db.models import Q, Count, Max
from rest_framework.decorators import action
from datetime import datetime, timedelta
from django.db.models import Case, Value, When, IntegerField
from rest_framework.parsers import MultiPartParser, FormParser 
from rest_framework.exceptions import PermissionDenied
# Create your views here.

class ViewComunicacionesCircular(viewsets.ModelViewSet):
    queryset = ComunicacionesCircular.objects.annotate(
    prioridad_estado=Case(
        When(estado="Publicado", then=Value(1)),
        When(estado="Borrador", then=Value(2)),
        When(estado="Inactivo", then=Value(3)),
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
        if instance.estado !='Inactivo':
            instance.estado = 'Borrador'
        else :
            instance.estado = 'Inactivo'
            
        instance.save()
        return response.Response(
            {"message": f"Circular '{instance.titulo}' marcada como inactiva."}, 
            status=status.HTTP_200_OK
        )


class ViewComunicacionesComunicado(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WriteSerializerComunicacionesComunicado
        return ReadSerializerComunicacionesComunicado

    def _obtener_rol(self):
        if self.request.user.is_superuser:
            return 'administrador'

        usuario_rol = AuthUsuarioRol.objects.filter(usuario=self.request.user).select_related('rol').first()
        if usuario_rol and usuario_rol.rol:
            return usuario_rol.rol.nombre.lower()
        return 'usuario'

    def _puede_emitir(self):
        return self._obtener_rol() in {'docente', 'administrador'}

    def get_queryset(self):
        queryset = ComunicacionesComunicado.objects.select_related('publicado_por').order_by('-fecha_publicacion')
        rol = self._obtener_rol()

        if rol == 'administrador':
            return queryset

        if rol == 'docente':
            return queryset.filter(publicado_por=self.request.user)

        if rol == 'estudiante':
            return queryset.filter(visible=True, destinatarios__contains=['estudiantes'])

        if rol == 'encargado':
            return queryset.filter(visible=True, destinatarios__contains=['encargados'])

        return queryset.filter(visible=True)

    def perform_create(self, serializer):
        if not self._puede_emitir():
            raise PermissionDenied('Solo docentes o administradores pueden emitir comunicados.')
        serializer.save(publicado_por=self.request.user)

    def perform_update(self, serializer):
        if not self._puede_emitir():
            raise PermissionDenied('Solo docentes o administradores pueden editar comunicados.')

        instance = self.get_object()
        if self._obtener_rol() != 'administrador' and instance.publicado_por_id != self.request.user.id:
            raise PermissionDenied('Solo puedes editar tus propios comunicados.')

        serializer.save()

    def destroy(self, request, *args, **kwargs):
        if not self._puede_emitir():
            raise PermissionDenied('Solo docentes o administradores pueden ocultar comunicados.')

        instance = self.get_object()
        if self._obtener_rol() != 'administrador' and instance.publicado_por_id != request.user.id:
            raise PermissionDenied('Solo puedes ocultar tus propios comunicados.')

        instance.visible = False
        instance.save(update_fields=['visible'])

        return response.Response(
            {"message": f"Comunicado '{instance.titulo}' ocultado correctamente."},
            status=status.HTTP_200_OK
        )

class RegistroUsuarioView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegistroSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return response.Response(
                {"mensaje": "Usuario registrado exitosamente"}, 
                status=status.HTTP_201_CREATED
            )
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ViewEstudiantes(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EstudianteListadoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'persona__nombre',
        'persona__primer_apellido',
        'persona__segundo_apellido',
        'persona__identificacion',
        'codigo_estudiante'
    ]
    ordering_fields = ['codigo_estudiante', 'fecha_ingreso', 'estado_estudiante']
    ordering = ['persona__primer_apellido', 'persona__nombre']

    def _get_role_name(self):
        if self.request.user and self.request.user.is_superuser:
            return 'administrador'

        usuario_rol = AuthUsuarioRol.objects.filter(usuario=self.request.user).select_related('rol').first()
        if usuario_rol and usuario_rol.rol:
            return (usuario_rol.rol.nombre or '').strip().lower()

        return ''

    def get_queryset(self):
        rol = self._get_role_name()
        if rol not in {'administrador', 'docente'}:
            raise PermissionDenied('No tienes permisos para consultar estudiantes.')

        return AuthUsuarioRol.objects.select_related(
            'usuario',
            'usuario__persona',
            'rol'
        ).filter(
            rol__nombre__iexact='estudiante',
            usuario__is_active=True
        )