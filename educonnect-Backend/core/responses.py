"""
Respuestas API estandarizadas para EduConnect.

Todas las respuestas siguen el mismo envelope:

Éxito:
    {
        "success": true,
        "data": { ... },          ← resultado
        "message": "...",         ← opcional
        "meta": { ... }           ← paginación u otros metadatos
    }

Error (manejado por core/exceptions.py):
    {
        "success": false,
        "error": {
            "code": "...",
            "message": "...",
            "detail": { ... }
        }
    }
"""

from rest_framework.response import Response
from rest_framework import status


def success_response(
    data=None,
    message: str = "",
    status_code: int = status.HTTP_200_OK,
    meta: dict | None = None,
) -> Response:
    """
    Respuesta exitosa estándar.

    Uso:
        return success_response(serializer.data, "Docente creado.", status.HTTP_201_CREATED)
    """
    body = {"success": True, "data": data}
    if message:
        body["message"] = message
    if meta:
        body["meta"] = meta
    return Response(body, status=status_code)


def created_response(data=None, message: str = "Recurso creado exitosamente.") -> Response:
    return success_response(data, message, status.HTTP_201_CREATED)


def no_content_response(message: str = "Operación completada.") -> Response:
    """Para operaciones que no devuelven datos (DELETE, archive, etc.)."""
    return Response({"success": True, "message": message}, status=status.HTTP_200_OK)


def paginated_response(
    data,
    page_obj,
    message: str = "",
) -> Response:
    """
    Respuesta paginada usando el paginador de DRF.

    Args:
        data    : datos serializados de la página actual
        page_obj: instancia de paginador con count, next, previous
    """
    meta = {
        "count": getattr(page_obj, "count", None),
        "next":  getattr(page_obj, "get_next_link", lambda: None)(),
        "previous": getattr(page_obj, "get_previous_link", lambda: None)(),
    }
    return success_response(data, message, meta=meta)


def error_response(
    message: str,
    code: str = "error",
    detail=None,
    status_code: int = status.HTTP_400_BAD_REQUEST,
) -> Response:
    """
    Respuesta de error manual (sin pasar por el exception handler).
    Útil para errores de negocio dentro de views.
    """
    body: dict = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
        },
    }
    if detail is not None:
        body["error"]["detail"] = detail
    return Response(body, status=status_code)
