from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework import serializers
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Plantilla

parser_classes = [MultiPartParser, FormParser]

class PlantillaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plantilla
        fields = ["id", "nombre", "categoria", "ultima_actualizacion", "estado", "archivo_adjunto"]

class ViewOficiosPlantilla(viewsets.ModelViewSet):
    queryset = Plantilla.objects.all().order_by("-ultima_actualizacion")
    serializer_class = PlantillaSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.estado = "Inactivo" if instance.estado != "Inactivo" else "Borrador"
        instance.save()
        return Response({"message": "Estado actualizado", "estado": instance.estado}, status=status.HTTP_200_OK)