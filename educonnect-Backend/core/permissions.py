"""
Clases de permisos centralizadas para EduConnect.

Modelo de roles:
  - Administrador : acceso total, gestiona desde el panel admin
  - Docente       : rol base al registrarse (@mep.go.cr)
      · sub-rol Comité   : asignado por admin, accede a módulo de comités
      · sub-rol Auxiliar : asignado por admin, accede a informes económicos
  - Estudiante    : creado solo por admin (@est.mep.go.cr)
"""

from rest_framework import permissions
from rest_framework.permissions import IsAuthenticated  # re-exportado para imports desde core.permissions
from django.core.cache import cache

# Nombres canónicos de roles en la base de datos
ROLE_ADMIN     = "administrador"
ROLE_DOCENTE   = "docente"
ROLE_ESTUDIANTE = "estudiante"
ROLE_COMITE    = "comite"
ROLE_AUXILIAR  = "auxiliares"

# Tiempo de caché de roles por usuario (segundos)
ROLES_CACHE_TTL = 60


def _get_user_roles(user) -> set[str]:
    """
    Devuelve el conjunto de nombres de rol del usuario.
    Se cachea por usuario para evitar N+1 queries en cada request.
    """
    if not user or not user.is_authenticated:
        return set()

    cache_key = f"user_roles_{user.pk}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    from apps.databaseModels.models import AuthUsuarioRol
    roles = set(
        AuthUsuarioRol.objects
        .filter(usuario=user, rol__activo=True)
        .values_list("rol__nombre", flat=True)
    )
    cache.set(cache_key, roles, ROLES_CACHE_TTL)
    return roles


def invalidate_user_roles_cache(user_id: int):
    """Llama esto cada vez que se modifiquen los roles de un usuario."""
    cache.delete(f"user_roles_{user_id}")


def user_has_role(user, *role_names: str) -> bool:
    """Devuelve True si el usuario tiene AL MENOS UNO de los roles indicados."""
    if getattr(user, "is_superuser", False):
        return True
    roles = _get_user_roles(user)
    return bool(roles.intersection(set(role_names)))


# ─── Permission classes ────────────────────────────────────────────────────────

class IsAdmin(permissions.BasePermission):
    """Solo administradores o superusuarios."""
    message = "Se requiere rol de Administrador."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and (
                getattr(request.user, "is_superuser", False)
                or user_has_role(request.user, ROLE_ADMIN)
            )
        )


class IsDocente(permissions.BasePermission):
    """Solo docentes (o admin)."""
    message = "Se requiere rol de Docente."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and user_has_role(request.user, ROLE_DOCENTE, ROLE_ADMIN)
        )


class IsEstudiante(permissions.BasePermission):
    """Solo estudiantes."""
    message = "Se requiere rol de Estudiante."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and user_has_role(request.user, ROLE_ESTUDIANTE)
        )


class IsComiteUser(permissions.BasePermission):
    """Usuarios con sub-rol Comité o administradores."""
    message = "Se requiere sub-rol de Comité."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and user_has_role(request.user, ROLE_COMITE, ROLE_ADMIN)
        )


class IsAuxiliarUser(permissions.BasePermission):
    """Usuarios con sub-rol Auxiliar o administradores."""
    message = "Se requiere sub-rol de Auxiliar."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and user_has_role(request.user, ROLE_AUXILIAR, ROLE_ADMIN)
        )


class IsDocenteOrAdmin(permissions.BasePermission):
    """Docentes o administradores (uso más frecuente)."""
    message = "Se requiere rol de Docente o Administrador."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and user_has_role(request.user, ROLE_DOCENTE, ROLE_ADMIN)
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    A nivel de objeto: el usuario es el dueño del recurso o es admin.
    El modelo debe exponer un campo `usuario`, `docente` o `creado_por`
    que apunte a AuthUsuario.
    """
    message = "No tienes permiso para acceder a este recurso."

    def has_object_permission(self, request, view, obj):
        if user_has_role(request.user, ROLE_ADMIN):
            return True
        for field in ("usuario", "docente", "creado_por", "elaborada_por", "publicado_por"):
            owner = getattr(obj, field, None)
            if owner is not None and owner == request.user:
                return True
        return False


class ReadOnly(permissions.BasePermission):
    """Permite solo métodos seguros (GET, HEAD, OPTIONS)."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.method in permissions.SAFE_METHODS
        )
