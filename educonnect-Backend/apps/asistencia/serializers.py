from rest_framework import serializers
from .models import AsistenciaRegistro, AsistenciaDetalle


class AsistenciaDetalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AsistenciaDetalle
        fields = "__all__"


class AsistenciaRegistroSerializer(serializers.ModelSerializer):
    detalles = AsistenciaDetalleSerializer(many=True, read_only=True)

    class Meta:
        model = AsistenciaRegistro
        fields = "__all__"