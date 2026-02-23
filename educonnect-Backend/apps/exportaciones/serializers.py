from rest_framework import serializers
from .models import Exportacion

class ExportacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exportacion
        fields = "__all__"
        read_only_fields = ["docente", "creado", "actualizado", "archivo"]