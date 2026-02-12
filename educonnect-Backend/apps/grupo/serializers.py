from rest_framework import serializers
from apps.databaseModels.models import AcademicoGrupo

class AcademicoGrupoSerializer(serializers.ModelSerializer):
    grado_nombre = serializers.CharField(source='grado.nombre', read_only=True)
    seccion_nombre = serializers.CharField(source='seccion.nombre', read_only=True)
    label = serializers.SerializerMethodField()

    class Meta:
        model = AcademicoGrupo
        fields = [
            'id', 'nombre', 'codigo_grupo', 'aula', 'estado', 
            'periodo', 'grado', 'seccion', 'docente_guia',
            'grado_nombre', 'seccion_nombre', 'label'
        ]

    def get_label(self, obj):
        return f"{obj.nombre} ({obj.codigo_grupo})"