from rest_framework import serializers
from .models import * 
from django.contrib.auth.hashers import make_password
from datetime import date

class ReadSerializerComunicacionesCircular (serializers.ModelSerializer):
    creada_por = serializers.StringRelatedField()
    class Meta:
        model = ComunicacionesCircular
        fields = "__all__"

class WriteSerializerComunicacionesCircular (serializers.ModelSerializer):
    class Meta:
        model = ComunicacionesCircular
        fields = "__all__"
    def validate_fecha_vigencia_fin(self, value):
        if value == "" or value is None:
            return None
        return value

    def validate_archivo_adjunto(self, value):
        if value == "":
            return None
        return value


#Necesario para registrarse
class RegistroSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(write_only=True)
    primer_apellido = serializers.CharField(write_only=True)
    fecha_nacimiento = serializers.DateField(write_only=True)
    genero = serializers.CharField(write_only=True)
    
    class Meta:
        model = AuthUsuario
        fields = [
            'username', 'email', 'password', 'nombre', 
            'primer_apellido', 'fecha_nacimiento', 'genero'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        nombre = validated_data.pop('nombre')
        primer_apellido = validated_data.pop('primer_apellido')
        fecha_nacimiento = validated_data.pop('fecha_nacimiento')
        genero = validated_data.pop('genero')
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
        return usuario