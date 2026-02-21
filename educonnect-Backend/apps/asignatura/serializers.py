from rest_framework import serializers
from apps.databaseModels.models import AcademicoAsignatura

class AcademicoAsignaturaSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()

    class Meta:
        model = AcademicoAsignatura
        fields = [
            'id', 'codigo', 'nombre', 'area', 'horas_semanales', 
            'activo', 'label'
        ]

    def get_label(self, obj):
        return f"{obj.codigo} - {obj.nombre}"