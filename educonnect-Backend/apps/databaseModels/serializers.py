from rest_framework import serializers
from .models import * 
from django.contrib.auth.hashers import make_password
from datetime import date

class ReadSerializerComunicacionesCircular (serializers.ModelSerializer):
    publicado_por = serializers.ReadOnlyField(source='publicado_por.username')
    creada_por = serializers.StringRelatedField()
    class Meta:
        model = ComunicacionesCircular
        fields = "__all__"

class WriteSerializerComunicacionesCircular(serializers.ModelSerializer):
    autor_nombre = serializers.ReadOnlyField(source='creada_por.username')

    class Meta:
        model = ComunicacionesCircular
        fields = [
            'id', 'titulo', 'contenido', 'archivo_adjunto', 
            'fecha_vigencia_inicio', 'fecha_vigencia_fin', 
            'estado', 'categoria', 'fecha_creacion', 'autor_nombre'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'creada_por']

    def validate_estado(self,value):
        if value =="Inactivo" :
            return serializers.ValidationError(
            {"error": "Este registro está inactivo y no se puede editar."}
        )
        return value
    def validate_fecha_vigencia_fin(self, value):
        if value == "" or value is None:
            return None
        return value
    
    def validate_archivo_adjunto(self, value):
        if isinstance(value, str):
            return None
        return value

#Necesario para registrarse
class RegistroSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(write_only=True)
    primer_apellido = serializers.CharField(write_only=True)
    fecha_nacimiento = serializers.DateField(write_only=True)
    genero = serializers.CharField(write_only=True)
    rol = serializers.CharField(write_only=True, required=False, default='estudiante')
    
    class Meta:
        model = AuthUsuario
        fields = [
            'username', 'email', 'password', 'nombre', 
            'primer_apellido', 'fecha_nacimiento', 'genero', 'rol'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        nombre = validated_data.pop('nombre')
        primer_apellido = validated_data.pop('primer_apellido')
        fecha_nacimiento = validated_data.pop('fecha_nacimiento')
        genero = validated_data.pop('genero')
        rol_nombre = validated_data.pop('rol', 'estudiante')
        
        validated_data['password'] = make_password(validated_data['password'])
        persona = PersonasPersona.objects.create(
            nombre=nombre,
            primer_apellido=primer_apellido,
            fecha_nacimiento=fecha_nacimiento,
            genero=genero,
            identificacion=validated_data.get('username'),
            tipo_identificacion='cedula',
            fecha_modificacion = date.today(),
            
        )
        
        usuario = AuthUsuario.objects.create(
            persona=persona,
            **validated_data
        )
        
        # Asignar rol al usuario
        try:
            from .models import AuthRol, AuthUsuarioRol
            from django.utils import timezone
            
            # Buscar o crear el rol
            rol = AuthRol.objects.filter(nombre__iexact=rol_nombre).first()
            if rol:
                AuthUsuarioRol.objects.create(
                    usuario=usuario,
                    rol=rol,
                    fecha_asignacion=timezone.now()
                )
        except Exception as e:
            # Si hay error al asignar rol, continuar sin bloquear
            pass
        
        return usuario