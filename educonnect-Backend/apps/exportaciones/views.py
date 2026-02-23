from rest_framework import viewsets, permissions, serializers
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.decorators import action
from django.http import FileResponse
from rest_framework.response import Response
from rest_framework import status

from .models import Exportacion

class ExportacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exportacion
        fields = "__all__"
        read_only_fields = ["docente", "creado", "actualizado"]

class ViewExportaciones(viewsets.ModelViewSet):
    serializer_class = ExportacionSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        return Exportacion.objects.filter(docente=self.request.user).order_by("-actualizado")

    def perform_create(self, serializer):
        serializer.save(docente=self.request.user)

    @action(detail=True, methods=["get"], url_path="archivo")
    def descargar_archivo(self, request, pk=None):
        exp = self.get_object()

        if not exp.archivo:
            return Response({"detail": "No hay archivo."}, status=status.HTTP_404_NOT_FOUND)

        # Cloudinary/raw storage: abrir con storage.open
        f = exp.archivo.open("rb")
        response = FileResponse(f, as_attachment=True)

        # nombre sugerido
        filename = exp.archivo.name.split("/")[-1]
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response