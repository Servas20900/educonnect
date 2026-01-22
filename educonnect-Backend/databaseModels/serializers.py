from rest_framework import serializers
from .models import * 
from django.contrib.auth.hashers import make_password
from datetime import date
# class ComunicacionesCircular(models.Model):
#     id = models.BigAutoField(primary_key=True) generada bd
#     titulo = models.CharField(max_length=200) frontend
#     contenido = models.TextField() frontend
#     fecha_emision = models.DateField() frontend
#     fecha_vigencia_inicio = models.DateField() frontend
#     fecha_vigencia_fin = models.DateField(blank=True, null=True) frontend
#     prioridad = models.CharField(max_length=20) frontend
#     requiere_confirmacion = models.BooleanField()frontend
#     archivo_adjunto = models.CharField(max_length=255, blank=True, null=True) frontend
#     roles_destinatarios = models.JSONField() frontend
#     activa = models.BooleanField() 
#     fecha_creacion = models.DateTimeField()
#     creada_por = models.ForeignKey(AuthUsuario, models.DO_NOTHING) 

#     class Meta:
#         managed = False
#         db_table = 'comunicaciones_circular'


class ReadSerializerComunicacionesCircular ():
    class Meta:
        model = ComunicacionesCircular
        fields = "__all__"

class WriteSerializerComunicacionesCircular ():
    class Meta:
        model = ComunicacionesCircular
        fields = "__all__"
    

# class ComunicacionesComunicado(models.Model):
#     id = models.BigAutoField(primary_key=True)
#     titulo = models.CharField(max_length=200)
#     contenido = models.TextField()
#     tipo_comunicado = models.CharField(max_length=50)
#     destinatarios = models.JSONField()
#     fecha_publicacion = models.DateTimeField()
#     fecha_vigencia = models.DateTimeField(blank=True, null=True)
#     visible = models.BooleanField()
#     publicado_por = models.ForeignKey(AuthUsuario, models.DO_NOTHING)

#     class Meta:
#         managed = False
#         db_table = 'comunicaciones_comunicado'
class SerializerComunicacionesComunicado ():
    class Meta:
        model = ComunicacionesComunicado
        fields = "__all__"

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
        identificacion_usuario = validated_data.get('username')
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
