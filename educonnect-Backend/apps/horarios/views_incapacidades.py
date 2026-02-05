import os
from django.conf import settings
from django.utils import timezone

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.databaseModels.models import HorariosIncapacidad
from .serializers_incapacidades import (
    ReadSerializerHorariosIncapacidad,
    WriteSerializerHorariosIncapacidad,
)

def save_upload(file, folder: str) -> str:
    os.makedirs(os.path.join(settings.MEDIA_ROOT, folder), exist_ok=True)
    filename = f"{timezone.now().strftime('%Y%m%d_%H%M%S')}_{file.name}"
    relative_path = os.path.join(folder, filename).replace("\\", "/")
    full_path = os.path.join(settings.MEDIA_ROOT, relative_path)

    with open(full_path, "wb+") as dest:
        for chunk in file.chunks():
            dest.write(chunk)

    return relative_path


class ViewHorariosIncapacidad(viewsets.ModelViewSet):
    queryset = HorariosIncapacidad.objects.all().order_by("-id")
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return WriteSerializerHorariosIncapacidad
        return ReadSerializerHorariosIncapacidad

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        archivo = request.FILES.get("archivo")
        doc_path = save_upload(archivo, "incapacidades") if archivo else ""

        data = dict(serializer.validated_data)

        # ✅ IMPORTANTE: evitar duplicar fecha_registro (ya viene en validated_data)
        data.pop("fecha_registro", None)

        # Opcional: si también te llega "archivo" en validated_data, lo podés quitar
        # porque vos ya lo manejas con request.FILES y lo guardas a mano.
        data.pop("archivo", None)

        obj = HorariosIncapacidad.objects.create(
            **data,
            documento_adjunto=doc_path,
            registrada_por=request.user,
            fecha_registro=timezone.now(),
        )

        return Response(
            ReadSerializerHorariosIncapacidad(obj).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=["get"])
    def pendientes(self, request):
        qs = self.get_queryset().exclude(documento_adjunto__isnull=True).exclude(documento_adjunto__exact="")
        qs = qs.exclude(motivo__startswith="[VALIDADO]").exclude(motivo__startswith="[RECHAZADO]")

        data = []
        for x in qs[:200]:
            data.append({
                "id": x.id,
                "nombrePersonal": str(x.docente),
                "tipo": "Incapacidad",
                "fechaSubida": x.fecha_registro.date().isoformat() if getattr(x, "fecha_registro", None) else None,
                "documentoUrl": (settings.MEDIA_URL + x.documento_adjunto) if x.documento_adjunto else None,
            })
        return Response(data)

    @action(detail=True, methods=["post"])
    def validar(self, request, pk=None):
        obj = self.get_object()
        if not obj.motivo.startswith("[VALIDADO]"):
            obj.motivo = "[VALIDADO] " + obj.motivo
            obj.save(update_fields=["motivo"])
        return Response({"message": "Validado"}, status=200)

    @action(detail=True, methods=["post"])
    def rechazar(self, request, pk=None):
        obj = self.get_object()
        comentario = request.data.get("comentario", "")
        if not obj.motivo.startswith("[RECHAZADO]"):
            obj.motivo = f"[RECHAZADO] {obj.motivo}{(' - ' + comentario) if comentario else ''}"
            obj.save(update_fields=["motivo"])
        return Response({"message": "Rechazado"}, status=200)
