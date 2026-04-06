from rest_framework import viewsets, permissions,response,status
from rest_framework.exceptions import PermissionDenied
from apps.databaseModels.models import HorariosHorario, AuthUsuarioRol
from .serializers import ReadSerializerHorariosHorario, WriteSerializerHorariosHorario
from django.db.models import Case, Value, When, IntegerField
from core.views import obtener_rol_usuario
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
    permission_classes = [permissions.IsAuthenticated]

    def _base_queryset(self):
        return HorariosHorario.objects.annotate(
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
            return qs.filter(docente=user).exclude(estado__in=['Inactivo', 'Archivado'])

        return qs.none()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WriteSerializerHorariosHorario
        return ReadSerializerHorariosHorario

    def perform_create(self, serializer):
        if not self._es_admin(self.request.user):
            raise PermissionDenied('Solo administración puede crear horarios.')
        serializer.save(creado_por=self.request.user)

    def perform_update(self, serializer):
        if not self._es_admin(self.request.user):
            raise PermissionDenied('Solo administración puede editar horarios.')
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        if not self._es_admin(request.user):
            raise PermissionDenied('Solo administración puede eliminar horarios.')
        instance = self.get_object()
        instance.estado = 'Inactivo'
        instance.save()
        
        return response.Response(
            {"message": f"El horario '{instance.nombre}' ha sido marcado como inactivo."},
            status=status.HTTP_200_OK
        )