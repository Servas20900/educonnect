from rest_framework import viewsets, permissions, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from django.utils.timezone import now
from django.http import FileResponse, Http404

from .models import Planeamiento


class PlaneamientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Planeamiento
        fields = "__all__"
        read_only_fields = ["docente", "estado", "fecha_envio", "creado", "actualizado"]


class ViewPlaneamiento(viewsets.ModelViewSet):
    queryset = Planeamiento.objects.all()
    serializer_class = PlaneamientoSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        return Planeamiento.objects.filter(docente=self.request.user).order_by("-creado")

    def perform_create(self, serializer):
        serializer.save(docente=self.request.user)

    # ✅ POST /api/v1/planeamientos/Planeamientos/<id>/enviar/
    @action(detail=True, methods=["post"], url_path="enviar")
    def enviar(self, request, pk=None):
        plane = self.get_object()

        if plane.estado != "Borrador":
            return Response(
                {"detail": "Solo se puede enviar un planeamiento en Borrador."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not plane.archivo:
            return Response(
                {"detail": "Debes subir un archivo antes de enviar."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        plane.estado = "En revisión"
        plane.fecha_envio = now().date()
        plane.save()

        return Response(self.get_serializer(plane).data, status=status.HTTP_200_OK)

    # ✅ GET /api/v1/planeamientos/Planeamientos/<id>/archivo/
    @action(detail=True, methods=["get"], url_path="archivo")
    def archivo(self, request, pk=None):
        plane = self.get_object()

        if not plane.archivo:
            raise Http404("Este planeamiento no tiene archivo.")

        # abre el archivo desde tu storage (cloudinary_storage en tu caso)
        f = plane.archivo.open("rb")
        filename = plane.archivo.name.split("/")[-1]

        resp = FileResponse(f, content_type="application/octet-stream")
        resp["Content-Disposition"] = f'attachment; filename="{filename}"'
        return resp