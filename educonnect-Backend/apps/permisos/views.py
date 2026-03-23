from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from apps.databaseModels.models import AuthUsuario, AuthRol, AuthPermiso, AuthUsuarioRol, AuthRolPermiso
from .serializers import (
    UsuarioListSerializer, UsuarioDetailSerializer, UsuarioUpdateSerializer,
    RolSerializer, RolUpdateSerializer, PermisoSerializer, ModuloSerializer
)


class UsuarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de usuarios
    """
    queryset = AuthUsuario.objects.all().order_by('-fecha_registro')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UsuarioListSerializer
        elif self.action in ['update', 'partial_update']:
            return UsuarioUpdateSerializer
        return UsuarioDetailSerializer
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Activa o desactiva un usuario"""
        usuario = self.get_object()
        usuario.is_active = not usuario.is_active
        usuario.save()
        return Response({
            'message': f'Usuario {"activado" if usuario.is_active else "desactivado"} exitosamente',
            'is_active': usuario.is_active
        })
    
    @action(detail=True, methods=['post'])
    def assign_role(self, request, pk=None):
        """Asigna uno o múltiples roles a un usuario"""
        usuario = self.get_object()
        roles_payload = request.data.get('rol_ids')

        # Compatibilidad con el payload histórico de un solo rol.
        if roles_payload is None:
            rol_id = request.data.get('rol_id')
            roles_payload = [rol_id] if rol_id is not None else []

        if not isinstance(roles_payload, list) or not roles_payload:
            return Response(
                {'error': 'rol_id o rol_ids es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Limpiar ids vacíos y duplicados.
        unique_role_ids = []
        seen_ids = set()
        for role_id in roles_payload:
            if role_id in (None, ''):
                continue
            role_id_str = str(role_id)
            if role_id_str in seen_ids:
                continue
            seen_ids.add(role_id_str)
            unique_role_ids.append(role_id)

        if not unique_role_ids:
            return Response(
                {'error': 'No se recibieron IDs de rol válidos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        roles = list(AuthRol.objects.filter(id__in=unique_role_ids, activo=True))
        found_ids = {str(rol.id) for rol in roles}
        missing_ids = [rid for rid in unique_role_ids if str(rid) not in found_ids]

        if missing_ids:
            return Response(
                {
                    'error': 'Uno o más roles no existen o están inactivos',
                    'roles_invalidos': missing_ids,
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Reemplazar las asignaciones actuales por el nuevo conjunto de roles.
        AuthUsuarioRol.objects.filter(usuario=usuario).delete()
        asignaciones = [
            AuthUsuarioRol(
                usuario=usuario,
                rol=rol,
                fecha_asignacion=timezone.now()
            )
            for rol in roles
        ]
        AuthUsuarioRol.objects.bulk_create(asignaciones)

        return Response({
            'message': 'Roles asignados exitosamente',
            'roles_asignados': [{'id': rol.id, 'nombre': rol.nombre} for rol in roles]
        })


class RolViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de roles
    """
    queryset = AuthRol.objects.all().order_by('nombre')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return RolUpdateSerializer
        return RolSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filtrar solo roles activos si se solicita
        if self.request.query_params.get('activos_only') == 'true':
            queryset = queryset.filter(activo=True)
        return queryset
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Activa o desactiva un rol"""
        rol = self.get_object()
        rol.activo = not rol.activo
        rol.fecha_modificacion = timezone.now()
        rol.save()
        return Response({
            'message': f'Rol {"activado" if rol.activo else "desactivado"} exitosamente',
            'activo': rol.activo
        })
    
    @action(detail=True, methods=['post'])
    def update_permissions(self, request, pk=None):
        """Actualiza los permisos de un rol"""
        rol = self.get_object()
        permisos_ids = request.data.get('permisos_ids', [])
        
        # Eliminar permisos actuales
        AuthRolPermiso.objects.filter(rol=rol).delete()
        
        # Asignar nuevos permisos
        for permiso_id in permisos_ids:
            try:
                permiso = AuthPermiso.objects.get(id=permiso_id, activo=True)
                AuthRolPermiso.objects.create(
                    rol=rol,
                    permiso=permiso,
                    fecha_asignacion=timezone.now()
                )
            except AuthPermiso.DoesNotExist:
                continue
        
        return Response({'message': 'Permisos actualizados exitosamente'})


class PermisoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para listar permisos (solo lectura)
    """
    queryset = AuthPermiso.objects.filter(activo=True).order_by('modulo', 'nombre')
    serializer_class = PermisoSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def by_module(self, request):
        """Agrupa permisos por módulo"""
        permisos = self.get_queryset()
        modulos_dict = {}
        
        for permiso in permisos:
            if permiso.modulo not in modulos_dict:
                modulos_dict[permiso.modulo] = []
            modulos_dict[permiso.modulo].append({
                'id': permiso.id,
                'nombre': permiso.nombre,
                'descripcion': permiso.descripcion,
                'accion': permiso.accion
            })
        
        return Response(modulos_dict)


class ModuloViewSet(viewsets.ViewSet):
    """
    ViewSet para listar los módulos del sistema (definidos estáticamente)
    """
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Lista todos los módulos disponibles en el sistema"""
        modulos = [
            {
                'id': 'admin',
                'nombre': 'Administración',
                'grupo': 'Admin',
                'submodulos': [
                    'Dashboard', 'Circulares', 'Programación', 'Horarios',
                    'Aprobaciones', 'Reportes', 'Usuarios', 'Permisos',
                    'Incapacidades', 'Comites', 'Oficios/Plantillas',
                    'Repositorios', 'Backups', 'Retención'
                ]
            },
            {
                'id': 'docente',
                'nombre': 'Módulo Docente',
                'grupo': 'Docente',
                'submodulos': [
                    'Dashboard', 'Estudiantes', 'Evaluaciones', 'Calificaciones',
                    'Promedios', 'Planeamientos', 'Comunicados', 'Asistencia',
                    'Exportaciones', 'Estudiantes en Riesgo'
                ]
            },
            {
                'id': 'comites',
                'nombre': 'Comités',
                'grupo': 'Comites',
                'submodulos': ['Home', 'Crear Actas', 'Agendar Reunion', 'Roles']
            },
            {
                'id': 'auxiliares',
                'nombre': 'Órganos Auxiliares',
                'grupo': 'Auxiliares',
                'submodulos': [
                    'Informes Económicos', 'Reglamentos',
                    'Informes PAT', 'Reportes Cumplimiento'
                ]
            },
            {
                'id': 'estudiante',
                'nombre': 'Módulo Estudiante',
                'grupo': 'Estudiante',
                'submodulos': ['Home', 'Notificaciones', 'Circulares y Horarios']
            }
        ]
        
        serializer = ModuloSerializer(modulos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def por_rol(self, request):
        """Obtiene los módulos permitidos para cada rol"""
        roles = AuthRol.objects.filter(activo=True)
        configuracion = {}
        
        for rol in roles:
            # Obtener módulos únicos de los permisos del rol
            permisos_rol = AuthRolPermiso.objects.filter(rol=rol).select_related('permiso')
            modulos = set(rp.permiso.modulo for rp in permisos_rol if rp.permiso)
            
            configuracion[rol.nombre.lower()] = {
                'modulos': list(modulos),
                'rol_id': rol.id,
                'tipo_rol': rol.tipo_rol
            }
        
        return Response(configuracion)
