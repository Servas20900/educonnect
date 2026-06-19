"""
Excepciones personalizadas y handler global de errores para EduConnect.

El handler se registra en settings.py:
    REST_FRAMEWORK = {
        'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
    }
"""

import logging
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_default_handler

logger = logging.getLogger("educonnect")


# ─── Excepciones custom ───────────────────────────────────────────────────────

class EduConnectException(APIException):
    """Base para todas las excepciones de negocio de EduConnect."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Ha ocurrido un error."
    default_code = "error"


class NotFoundError(EduConnectException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "El recurso solicitado no existe."
    default_code = "not_found"


class PermissionDeniedError(EduConnectException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "No tienes permiso para realizar esta acción."
    default_code = "permission_denied"


class ConflictError(EduConnectException):
    """Para conflictos de estado (ej: matrícula duplicada)."""
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Conflicto con el estado actual del recurso."
    default_code = "conflict"


class BusinessRuleError(EduConnectException):
    """Violación de regla de negocio (ej: porcentaje > 100%)."""
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = "La operación viola una regla de negocio."
    default_code = "business_rule_error"


class FileProcessingError(EduConnectException):
    """Error al procesar o acceder a un archivo."""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = "Error al procesar el archivo."
    default_code = "file_error"


# ─── Handler global ───────────────────────────────────────────────────────────

def custom_exception_handler(exc, context):
    """
    Intercepta todas las excepciones de DRF y las formatea en la
    estructura estándar de EduConnect:

    {
        "success": false,
        "error": {
            "code": "...",
            "message": "...",
            "detail": { ... }   ← solo en errores de validación
        }
    }
    """
    # Primero deja que DRF haga su trabajo
    response = drf_default_handler(exc, context)

    if response is None:
        # Excepción no manejada por DRF → 500
        logger.exception(
            "Excepción no controlada en %s",
            context.get("view", "unknown"),
            exc_info=exc,
        )
        return Response(
            {
                "success": False,
                "error": {
                    "code": "server_error",
                    "message": "Error interno del servidor.",
                },
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Construir cuerpo estandarizado
    data = response.data

    # Errores de validación de DRF vienen como dict o lista
    from rest_framework.exceptions import ValidationError as DRFValidationError
    if isinstance(exc, DRFValidationError):
        body = {
            "success": False,
            "error": {
                "code": "validation_error",
                "message": "Los datos enviados contienen errores.",
                "detail": data,
            },
        }
    else:
        # Extraer mensaje del detalle
        message = _extract_message(data)
        code = getattr(exc, "default_code", "error") or "error"
        body = {
            "success": False,
            "error": {
                "code": code,
                "message": message,
            },
        }

    response.data = body
    return response


def _extract_message(data) -> str:
    """Extrae un mensaje legible del detalle de la excepción."""
    if isinstance(data, dict):
        detail = data.get("detail", data)
        if hasattr(detail, "title"):          # ErrorDetail de DRF
            return str(detail)
        if isinstance(detail, dict):
            # Toma el primer valor no vacío
            for v in detail.values():
                return _extract_message(v)
        return str(detail)
    if isinstance(data, list) and data:
        return _extract_message(data[0])
    return str(data)
