"""
Validadores reutilizables para modelos, serializers y vistas de EduConnect.
"""

import os
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible


# ─── Archivos ─────────────────────────────────────────────────────────────────

ALLOWED_DOCUMENT_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv"
}

ALLOWED_IMAGE_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"
}

ALLOWED_ANY_EXTENSIONS = ALLOWED_DOCUMENT_EXTENSIONS | ALLOWED_IMAGE_EXTENSIONS

# 10 MB por defecto
DEFAULT_MAX_FILE_SIZE_MB = 10


@deconstructible
class FileExtensionValidator:
    """
    Valida que un archivo tenga una extensión permitida.

    Uso en modelo:
        archivo = models.FileField(validators=[FileExtensionValidator(allowed={'.pdf', '.docx'})])
    """

    def __init__(self, allowed: set[str] | None = None):
        self.allowed = {ext.lower() for ext in (allowed or ALLOWED_ANY_EXTENSIONS)}

    def __call__(self, value):
        ext = os.path.splitext(value.name)[1].lower() if hasattr(value, "name") else ""
        if ext not in self.allowed:
            allowed_str = ", ".join(sorted(self.allowed))
            raise ValidationError(
                f"Extensión '{ext}' no permitida. Extensiones válidas: {allowed_str}"
            )

    def __eq__(self, other):
        return isinstance(other, FileExtensionValidator) and self.allowed == other.allowed


@deconstructible
class FileSizeValidator:
    """
    Valida que un archivo no supere el tamaño máximo en MB.

    Uso en modelo:
        archivo = models.FileField(validators=[FileSizeValidator(max_mb=5)])
    """

    def __init__(self, max_mb: int = DEFAULT_MAX_FILE_SIZE_MB):
        self.max_mb = max_mb
        self.max_bytes = max_mb * 1024 * 1024

    def __call__(self, value):
        if hasattr(value, "size") and value.size > self.max_bytes:
            raise ValidationError(
                f"El archivo excede el tamaño máximo permitido de {self.max_mb} MB."
            )

    def __eq__(self, other):
        return isinstance(other, FileSizeValidator) and self.max_mb == other.max_mb


# Instancias de uso frecuente
validate_document = FileExtensionValidator(ALLOWED_DOCUMENT_EXTENSIONS)
validate_image    = FileExtensionValidator(ALLOWED_IMAGE_EXTENSIONS)
validate_any_file = FileExtensionValidator(ALLOWED_ANY_EXTENSIONS)
validate_size_2mb  = FileSizeValidator(max_mb=2)
validate_size_10mb = FileSizeValidator(max_mb=10)


# ─── Email / dominio ──────────────────────────────────────────────────────────

DOCENTE_DOMAIN   = "mep.go.cr"
ESTUDIANTE_DOMAIN = "est.mep.go.cr"
ALLOWED_DOMAINS   = {DOCENTE_DOMAIN, ESTUDIANTE_DOMAIN}


def validate_email_domain(email: str, allowed_domains: set[str] | None = None):
    """
    Lanza ValidationError si el dominio del email no está permitido.
    Por defecto valida contra los dominios institucionales.
    """
    domains = allowed_domains or ALLOWED_DOMAINS
    domain = email.split("@")[-1].lower() if "@" in email else ""
    if domain not in domains:
        allowed_str = ", ".join(f"@{d}" for d in sorted(domains))
        raise ValidationError(
            f"El correo debe pertenecer a uno de los dominios: {allowed_str}"
        )


def validate_docente_email(email: str):
    """Solo acepta correos @mep.go.cr."""
    validate_email_domain(email, {DOCENTE_DOMAIN})


def validate_estudiante_email(email: str):
    """Solo acepta correos @est.mep.go.cr."""
    validate_email_domain(email, {ESTUDIANTE_DOMAIN})


# ─── Fechas ───────────────────────────────────────────────────────────────────

from datetime import date as date_type


def validate_date_range(fecha_inicio: date_type, fecha_fin: date_type, label: str = ""):
    """
    Lanza ValidationError si fecha_fin < fecha_inicio.
    """
    if fecha_fin and fecha_inicio and fecha_fin < fecha_inicio:
        prefix = f"{label}: " if label else ""
        raise ValidationError(
            f"{prefix}La fecha de fin no puede ser anterior a la fecha de inicio."
        )


def validate_not_past_date(fecha: date_type, label: str = "fecha"):
    """
    Lanza ValidationError si la fecha es anterior a hoy.
    """
    if fecha and fecha < date_type.today():
        raise ValidationError(f"La {label} no puede ser una fecha pasada.")


def validate_no_weekend(fecha: date_type, label: str = "fecha"):
    """
    Lanza ValidationError si la fecha cae en sábado (5) o domingo (6).
    """
    if fecha and fecha.weekday() >= 5:
        raise ValidationError(f"La {label} no puede ser un día de fin de semana.")


# ─── Valores numéricos académicos ─────────────────────────────────────────────

def validate_porcentaje(valor, label: str = "valor porcentual"):
    """
    Valida que un porcentaje esté entre 0 y 100 (inclusive).
    """
    try:
        v = Decimal(str(valor))
    except Exception:
        raise ValidationError(f"El {label} debe ser un número.")
    if not (Decimal("0") <= v <= Decimal("100")):
        raise ValidationError(f"El {label} debe estar entre 0 y 100.")


def validate_nota(valor, nota_maxima=100, label: str = "nota"):
    """
    Valida que una nota esté entre 0 y nota_maxima (inclusive).
    """
    try:
        v = Decimal(str(valor))
        nm = Decimal(str(nota_maxima))
    except Exception:
        raise ValidationError(f"La {label} debe ser un número.")
    if not (Decimal("0") <= v <= nm):
        raise ValidationError(
            f"La {label} debe estar entre 0 y {nota_maxima}."
        )


def validate_suma_porcentaje(nuevo_valor: Decimal, valores_existentes: list[Decimal], excluir_id: int | None = None):
    """
    Valida que la suma de porcentajes no supere 100%.
    Útil al crear/editar evaluaciones de un grupo.

    Args:
        nuevo_valor      : porcentaje de la evaluación nueva o editada
        valores_existentes: lista de Decimal con los porcentajes actuales
        excluir_id       : ID de evaluación a excluir del total (para edición)
    """
    total = sum(valores_existentes) + Decimal(str(nuevo_valor))
    if total > Decimal("100"):
        raise ValidationError(
            f"La suma de valores porcentuales superaría el 100% (total actual: {total}%)."
        )
