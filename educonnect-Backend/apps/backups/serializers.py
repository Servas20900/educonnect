from rest_framework import serializers
from apps.databaseModels.models import AuthUsuario  # si lo necesitas
from .models import Backup  # asumiendo que creas este modelo

class BackupSerializer(serializers.ModelSerializer):
    url_descarga = serializers.SerializerMethodField()
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)

    class Meta:
        model = Backup
        fields = [
            'id', 'nombre_archivo', 'url_descarga', 'tipo',
            'tamano_bytes', 'estado', 'creado_por', 'creado_por_nombre', 'creado_en', 'notas'
        ]
        read_only_fields = fields

    def get_url_descarga(self, obj):
        # si usas Cloudinary u otra storage, devuelve la URL pública o un presigned URL
        if getattr(obj, 'file', None):
            try:
                return obj.file.url
            except Exception:
                return None
        return None


class BackupCreateSerializer(serializers.Serializer):
    TIPO_CHOICES = ('db', 'media', 'full')
    tipo = serializers.ChoiceField(choices=TIPO_CHOICES)
    incluir_media = serializers.BooleanField(default=False)
    nombre = serializers.CharField(max_length=200, required=False, allow_blank=True)
    conservar_local = serializers.BooleanField(default=False)

    def validate(self, data):
        # ejemplo de validación: si piden incluir media, tipo debe ser full o media
        if data['incluir_media'] and data['tipo'] == 'db':
            raise serializers.ValidationError("Para incluir media el tipo no puede ser sólo 'db'.")
        return data

    def create(self, validated_data):
        # crear instancia Backup con estado 'pending' y devolverla.
        # la ejecución real del dump se hace en la vista o en un task (recomendado).
        nombre = validated_data.get('nombre') or f"backup-{validated_data['tipo']}"
        backup = Backup.objects.create(
            nombre_archivo=nombre,
            tipo=validated_data['tipo'],
            estado='pending',
            creado_por=self.context['request'].user if 'request' in self.context else None
        )
        return backup


class BackupStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Backup
        fields = ['id', 'estado', 'progreso', 'mensaje_error', 'iniciado_en', 'terminado_en']
        read_only_fields = fields


class BackupRestoreSerializer(serializers.Serializer):
    confirm = serializers.BooleanField()
    drop_database = serializers.BooleanField(default=False)
    crear_backup_previo = serializers.BooleanField(default=True)

    def validate_confirm(self, v):
        if v is not True:
            raise serializers.ValidationError("Debes confirmar la restauración estableciendo 'confirm': true.")
        return v

    def validate(self, data):
        # aquí podrías verificar permisos si también tienes request en context
        request = self.context.get('request')
        if request and not request.user.is_superuser:
            raise serializers.ValidationError("Solo un superusuario puede restaurar respaldos.")
        return data