from rest_framework import serializers
from apps.databaseModels.models import ComitesReunion, ComitesActa, ComitesComite

class ReunionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComitesReunion
        fields = '__all__'

    def validate(self, data):
        """Validaciones de lógica de negocio"""
        if data.get('hora_fin') and data.get('hora_inicio'):
            if data['hora_fin'] <= data['hora_inicio']:
                raise serializers.ValidationError({
                    "hora_fin": "La hora de finalización debe ser posterior a la de inicio."
                })
        return data

class ActaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComitesActa
        fields = '__all__'
        read_only_fields = ['elaborada_por', 'fecha_elaboracion']