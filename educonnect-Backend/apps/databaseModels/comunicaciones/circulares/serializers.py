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
    DESTINATARIOS_VALIDOS = {'docentes', 'estudiantes', 'encargados'}

    class Meta:
        model = ComunicacionesCircular
        fields = [
            'id', 'titulo', 'contenido', 'archivo_adjunto',
            'fecha_vigencia_inicio', 'fecha_vigencia_fin',
            'estado', 'categoria', 'fecha_creacion', 'autor_nombre',
            'detalle', 'tipo_comunicado', 'destinatarios', 'visible'
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
            return ['docentes']

        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                raise serializers.ValidationError('Destinatarios debe ser un arreglo JSON valido.')

        if not isinstance(value, list) or not value:
            raise serializers.ValidationError('Debe seleccionar al menos un destinatario.')

        normalizados = []
        for item in value:
            destino = str(item).strip().lower()
            if destino == 'docente':
                destino = 'docentes'
            if destino not in self.DESTINATARIOS_VALIDOS:
                raise serializers.ValidationError('Destinatario invalido. Use docentes, estudiantes o encargados.')
            normalizados.append(destino)

        return sorted(list(set(normalizados)))
