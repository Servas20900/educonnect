import json
from rest_framework import serializers

from apps.databaseModels.models import ComunicacionesCircular


class ReadSerializerComunicacionesCircular(serializers.ModelSerializer):
    publicado_por = serializers.ReadOnlyField(source='creada_por.username')
    creada_por = serializers.StringRelatedField()

    class Meta:
        model = ComunicacionesCircular
        fields = '__all__'


class WriteSerializerComunicacionesCircular(serializers.ModelSerializer):
    autor_nombre = serializers.ReadOnlyField(source='creada_por.username')
    destinatarios = serializers.CharField(required=False, default='todos')

    DESTINATARIOS_VALIDOS = {'docentes', 'estudiantes', 'todos'}

    class Meta:
        model = ComunicacionesCircular
        fields = [
            'id', 'titulo', 'contenido', 'archivo_adjunto',
            'fecha_vigencia_inicio', 'fecha_vigencia_fin',
            'categoria', 'fecha_creacion', 'autor_nombre',
            'detalle', 'destinatarios', 'visible',
        ]
        read_only_fields = ['id', 'fecha_creacion', 'creada_por']

    def validate_fecha_vigencia_fin(self, value):
        if value == '' or value is None:
            return None
        return value

    def validate_archivo_adjunto(self, value):
        if isinstance(value, str):
            return None
        return value

    def validate_destinatarios(self, value):
        if value in (None, ''):
            return 'todos'

        # Parsear JSON string enviado desde FormData (ej: '["docentes"]')
        if isinstance(value, str):
            stripped = value.strip()
            if stripped.startswith('[') or stripped.startswith('"'):
                try:
                    value = json.loads(stripped)
                except (ValueError, TypeError):
                    pass

        # Acepta tanto string directo como lista legacy del frontend
        if isinstance(value, list):
            if not value:
                return 'todos'
            value = value[0]

        destino = str(value).strip().lower()
        if destino not in self.DESTINATARIOS_VALIDOS:
            raise serializers.ValidationError(
                f'Destinatario invalido. Use: {", ".join(sorted(self.DESTINATARIOS_VALIDOS))}.'
            )
        return destino
