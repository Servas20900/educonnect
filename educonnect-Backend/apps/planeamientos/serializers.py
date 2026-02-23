from rest_framework import serializers
from .models import Planeamiento


class PlaneamientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Planeamiento
        fields = "__all__"
        read_only_fields = ["docente", "estado", "fecha_envio", "creado", "actualizado"]