from rest_framework import serializers
from apps.databaseModels.models import HorariosIncapacidad

class ReadSerializerHorariosIncapacidad(serializers.ModelSerializer):
    docente = serializers.StringRelatedField()
    registrada_por = serializers.StringRelatedField()

    class Meta:
        model = HorariosIncapacidad
        fields = "__all__"

class WriteSerializerHorariosIncapacidad(serializers.ModelSerializer):
    archivo = serializers.FileField(write_only=True, required=False)

    class Meta:
        model = HorariosIncapacidad
        fields = "__all__"
        read_only_fields = ("id", "fecha_registro", "registrada_por", "documento_adjunto")
