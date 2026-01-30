from rest_framework import serializers
from databaseModels.models import AuthAuditoriaLog


class ReadSerializerAuthAuditoriaLog(serializers.ModelSerializer):
    usuario_email = serializers.CharField(source='usuario.email', read_only=True)
    usuario_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = AuthAuditoriaLog
        fields = [
            'id', 'usuario', 'usuario_email', 'usuario_nombre', 'accion', 
            'modulo', 'descripcion', 'tabla_afectada', 'resultado', 'fecha_hora',
            'ip_address', 'registro_id'
        ]
    
    def get_usuario_nombre(self, obj):
        if obj.usuario and obj.usuario.persona:
            return f"{obj.usuario.persona.nombre} {obj.usuario.persona.primer_apellido}"
        return "Sistema"
