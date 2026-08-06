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
    destinatarios = serializers.CharField(required=False, default='docentes')

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
        # Las circulares solo las puede consultar personal docente (no existe
        # ninguna pantalla de circulares para estudiantes en el sistema), así
        # que se fuerza siempre a 'docentes' sin importar qué envíe el cliente.
        return 'docentes'
