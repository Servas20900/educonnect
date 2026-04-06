from rest_framework import serializers
from apps.databaseModels.models import HorariosIncapacidad


class HorariosIncapacidadReadSerializer(serializers.ModelSerializer):
    docente_nombre = serializers.SerializerMethodField()
    registrada_por_nombre = serializers.SerializerMethodField()
    documento_url = serializers.SerializerMethodField()

    class Meta:
        model = HorariosIncapacidad
        fields = [
            'id',
            'docente',
            'docente_nombre',
            'tipo',
            'fecha_inicio',
            'fecha_fin',
            'motivo',
            'numero_documento',
            'documento_adjunto',
            'documento_url',
            'institucion_emisora',
            'registrada_por',
            'registrada_por_nombre',
            'fecha_registro',
            'fecha_creacion',
        ]

    def get_docente_nombre(self, obj):
        return str(obj.docente) if obj.docente else None

    def get_registrada_por_nombre(self, obj):
        return str(obj.registrada_por) if obj.registrada_por else None

    def get_documento_url(self, obj):
        request = self.context.get('request')
        if not obj.documento_adjunto:
            return None

        ruta = str(obj.documento_adjunto)
        if ruta.startswith('http://') or ruta.startswith('https://'):
            return ruta

        if request:
            return request.build_absolute_uri(f"/media/{ruta.lstrip('/')}")

        return f"/media/{ruta.lstrip('/')}"


class HorariosIncapacidadWriteSerializer(serializers.ModelSerializer):
    archivo = serializers.FileField(write_only=True, required=False)

    class Meta:
        model = HorariosIncapacidad
        fields = [
            'docente',
            'tipo',
            'fecha_inicio',
            'fecha_fin',
            'motivo',
            'numero_documento',
            'institucion_emisora',
            'archivo',
        ]

    def validate(self, attrs):
        inicio = attrs.get('fecha_inicio')
        fin = attrs.get('fecha_fin')
        if inicio and fin and inicio > fin:
            raise serializers.ValidationError({'fecha_fin': 'Debe ser mayor o igual a fecha_inicio'})

        tipo = str(attrs.get('tipo') or '').lower()
        if tipo and tipo not in ['incapacidad', 'justificante', 'permiso']:
            raise serializers.ValidationError({'tipo': 'Tipo invalido'})

        return attrs

