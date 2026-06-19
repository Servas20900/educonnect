"""
Mixins reutilizables para ViewSets y APIViews de EduConnect.

Uso típico en una view:
    class MiView(AtomicMixin, StandardResponseMixin, GenericAPIView):
        permission_classes = [IsDocente]
        ...
"""

from django.db import transaction
from core.responses import success_response, created_response, no_content_response, error_response
from rest_framework import status


# ─── Transacciones ────────────────────────────────────────────────────────────

class AtomicMixin:
    """
    Envuelve perform_create, perform_update y perform_destroy
    en una transacción atómica para garantizar consistencia.
    """

    @transaction.atomic
    def perform_create(self, serializer):
        super().perform_create(serializer)

    @transaction.atomic
    def perform_update(self, serializer):
        super().perform_update(serializer)

    @transaction.atomic
    def perform_destroy(self, instance):
        super().perform_destroy(instance)


# ─── Respuestas estándar ──────────────────────────────────────────────────────

class StandardResponseMixin:
    """
    Sobreescribe los métodos de respuesta de ModelViewSet
    para usar el envelope estándar de EduConnect.
    """

    success_create_message = "Recurso creado exitosamente."
    success_update_message = "Recurso actualizado exitosamente."
    success_delete_message = "Recurso eliminado exitosamente."

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return created_response(serializer.data, self.success_create_message)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return success_response(serializer.data, self.success_update_message)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return no_content_response(self.success_delete_message)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            from core.responses import paginated_response
            return paginated_response(serializer.data, self.paginator)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response(serializer.data)


# ─── Optimización de queries ──────────────────────────────────────────────────

class OptimizedQueryMixin:
    """
    Aplica select_related y prefetch_related definidos en la view
    al queryset base para evitar N+1 queries.

    Uso en view:
        class MiView(OptimizedQueryMixin, ListAPIView):
            select_related_fields  = ["docente__persona", "grupo"]
            prefetch_related_fields = ["calificaciones"]
    """

    select_related_fields: list[str] = []
    prefetch_related_fields: list[str] = []

    def get_queryset(self):
        qs = super().get_queryset()
        if self.select_related_fields:
            qs = qs.select_related(*self.select_related_fields)
        if self.prefetch_related_fields:
            qs = qs.prefetch_related(*self.prefetch_related_fields)
        return qs


# ─── Archivado (soft delete) ──────────────────────────────────────────────────

class ArchiveMixin:
    """
    Agrega action `archive` y `unarchive` para modelos con campo `estado`
    o campo `activo`.

    La view debe definir:
        archive_field = "estado"            # campo a modificar
        archive_value = "archivado"         # valor al archivar
        unarchive_value = "activo"          # valor al desarchivar
    """

    archive_field   = "activo"
    archive_value   = False
    unarchive_value = True

    def _set_archive_state(self, request, value, message):
        instance = self.get_object()
        setattr(instance, self.archive_field, value)
        instance.save(update_fields=[self.archive_field])
        serializer = self.get_serializer(instance)
        return success_response(serializer.data, message)

    def archive(self, request, *args, **kwargs):
        return self._set_archive_state(request, self.archive_value, "Recurso archivado.")

    def unarchive(self, request, *args, **kwargs):
        return self._set_archive_state(request, self.unarchive_value, "Recurso restaurado.")
