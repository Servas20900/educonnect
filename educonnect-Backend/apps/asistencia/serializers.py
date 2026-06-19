from rest_framework import serializers
from .models import AsistenciaRegistro, AsistenciaDetalle


class AsistenciaDetalleSerializer(serializers.ModelSerializer):
    estado = serializers.CharField(required=False, default='presente')

    class Meta:
        model = AsistenciaDetalle
        fields = "__all__"

    def validate_estado(self, value):
        v = str(value or '').strip().lower()
        if v not in {'presente', 'ausente', 'tardia'}:
            raise serializers.ValidationError('Estado inválido. Use: presente, ausente, tardia.')
        return v


class AsistenciaRegistroSerializer(serializers.ModelSerializer):
    detalles = AsistenciaDetalleSerializer(many=True, read_only=True)

    class Meta:
        model = AsistenciaRegistro
        fields = "__all__"