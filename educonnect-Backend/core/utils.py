"""
Utilidades compartidas entre todas las apps de EduConnect.

Centraliza lógica de acceso a entidades frecuentes para evitar
duplicación de código en views y serializers.
"""

from typing import Optional
from django.db.models import QuerySet


# ─── Usuario → Persona ────────────────────────────────────────────────────────

def get_persona_for_user(user) -> Optional[object]:
    """
    Devuelve PersonasPersona ligada al usuario, o None.
    """
    return getattr(user, "persona", None)


# ─── Docente ──────────────────────────────────────────────────────────────────

def get_docente_for_user(user) -> Optional[object]:
    """
    Devuelve PersonasDocente del usuario autenticado, o None.
    Usa select_related para evitar query adicional a PersonasPersona.
    """
    from apps.databaseModels.models import PersonasDocente
    persona = get_persona_for_user(user)
    if persona is None:
        return None
    return (
        PersonasDocente.objects
        .select_related("persona")
        .filter(persona=persona)
        .first()
    )


def get_docente_ids_for_user(user) -> list[int]:
    """
    Devuelve lista de IDs (PersonasDocente.persona_id) para el usuario.
    Útil para filtrar querysets de evaluaciones, asistencia, etc.
    """
    from apps.databaseModels.models import PersonasDocente
    persona = get_persona_for_user(user)
    if persona is None:
        return []
    return list(
        PersonasDocente.objects
        .filter(persona=persona)
        .values_list("persona_id", flat=True)
    )


# ─── Estudiante ───────────────────────────────────────────────────────────────

def get_estudiante_for_user(user) -> Optional[object]:
    """
    Devuelve PersonasEstudiante del usuario autenticado, o None.
    """
    from apps.databaseModels.models import PersonasEstudiante
    persona = get_persona_for_user(user)
    if persona is None:
        return None
    return (
        PersonasEstudiante.objects
        .select_related("persona")
        .filter(persona=persona)
        .first()
    )


# ─── Grupos ───────────────────────────────────────────────────────────────────

def get_grupos_for_docente(user) -> QuerySet:
    """
    Devuelve QuerySet de AcademicoGrupo donde el docente está asignado
    (ya sea como guía o como docente de asignatura).
    Solo grupos activos.
    """
    from apps.databaseModels.models import AcademicoGrupo, PersonasDocente
    persona = get_persona_for_user(user)
    if persona is None:
        return AcademicoGrupo.objects.none()

    docente = PersonasDocente.objects.filter(persona=persona).first()
    if docente is None:
        return AcademicoGrupo.objects.none()

    return (
        AcademicoGrupo.objects
        .filter(docente_guia=docente, estado="activo")
        .select_related("grado", "seccion", "periodo", "docente_guia__persona")
        .order_by("grado__numero_grado", "seccion__nombre")
    )


def get_grupo_docente_or_none(grupo_id: int, user) -> Optional[object]:
    """
    Devuelve el grupo si pertenece al docente autenticado, None si no.
    Evita que un docente acceda a grupos de otro.
    """
    grupos = get_grupos_for_docente(user)
    return grupos.filter(pk=grupo_id).first()


def assert_grupo_pertenece_a_docente(grupo_id: int, user):
    """
    Lanza PermissionDenied si el grupo no pertenece al docente.
    Usar en views antes de operar sobre el grupo.
    """
    from rest_framework.exceptions import PermissionDenied
    if get_grupo_docente_or_none(grupo_id, user) is None:
        raise PermissionDenied("No tienes acceso a este grupo.")


# ─── Docente-Grupo (asignación de asignatura) ─────────────────────────────────

def get_docente_grupo(grupo_id: int, user) -> Optional[object]:
    """
    Devuelve AcademicoDocenteGrupo activo para el docente y grupo.
    Retorna None si no existe.
    """
    from apps.databaseModels.models import AcademicoDocenteGrupo, PersonasDocente
    persona = get_persona_for_user(user)
    if persona is None:
        return None
    docente = PersonasDocente.objects.filter(persona=persona).first()
    if docente is None:
        return None
    return (
        AcademicoDocenteGrupo.objects
        .filter(docente=docente, grupo_id=grupo_id, activo=True)
        .select_related("asignatura", "grupo")
        .first()
    )


# ─── Roles ────────────────────────────────────────────────────────────────────

def normalizar_nombre_rol(nombre: str) -> str:
    """
    Normaliza un nombre de rol para comparación:
    elimina espacios, minúsculas, sin tildes.
    """
    import unicodedata
    nombre = nombre.strip().lower()
    return "".join(
        c for c in unicodedata.normalize("NFD", nombre)
        if unicodedata.category(c) != "Mn"
    )


def get_roles_for_user(user) -> list[str]:
    """
    Devuelve lista de nombres de rol del usuario (normalizados).
    """
    from apps.databaseModels.models import AuthUsuarioRol
    return list(
        AuthUsuarioRol.objects
        .filter(usuario=user, rol__activo=True)
        .values_list("rol__nombre", flat=True)
    )


def user_is_admin(user) -> bool:
    from core.permissions import user_has_role, ROLE_ADMIN
    return getattr(user, "is_superuser", False) or user_has_role(user, ROLE_ADMIN)


def user_is_docente(user) -> bool:
    from core.permissions import user_has_role, ROLE_DOCENTE
    return user_has_role(user, ROLE_DOCENTE)


def user_is_estudiante(user) -> bool:
    from core.permissions import user_has_role, ROLE_ESTUDIANTE
    return user_has_role(user, ROLE_ESTUDIANTE)


# ─── Nombre formateado de persona ─────────────────────────────────────────────

def nombre_completo(persona) -> str:
    """
    Devuelve 'Nombre PrimerApellido SegundoApellido' limpio.
    """
    if persona is None:
        return ""
    partes = [
        getattr(persona, "nombre", "") or "",
        getattr(persona, "primer_apellido", "") or "",
        getattr(persona, "segundo_apellido", "") or "",
    ]
    return " ".join(p.strip() for p in partes if p.strip())


def nombre_estudiante(estudiante) -> str:
    """Nombre completo de un PersonasEstudiante."""
    return nombre_completo(getattr(estudiante, "persona", None))


def nombre_docente(docente) -> str:
    """Nombre completo de un PersonasDocente."""
    return nombre_completo(getattr(docente, "persona", None))


# ─── Estudiantes de un grupo ──────────────────────────────────────────────────

def get_estudiantes_activos_grupo(grupo_id: int) -> QuerySet:
    """
    Devuelve QuerySet de PersonasEstudiante con matrícula activa en el grupo.
    Optimizado con select_related.
    """
    from apps.databaseModels.models import AcademicoMatricula
    return (
        AcademicoMatricula.objects
        .filter(grupo_id=grupo_id, estado="activo")
        .select_related(
            "estudiante__persona",
        )
        .order_by("estudiante__persona__primer_apellido", "estudiante__persona__nombre")
    )


# ─── Período activo ───────────────────────────────────────────────────────────

def get_periodo_activo() -> Optional[object]:
    """Devuelve el AcademicoPeriodo con estado='activo', o None."""
    from apps.databaseModels.models import AcademicoPeriodo
    return AcademicoPeriodo.objects.filter(estado="activo").first()
