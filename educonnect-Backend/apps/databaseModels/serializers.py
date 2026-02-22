from rest_framework import serializers
from .models import * 
from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.utils import timezone

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


class ReadSerializerComunicacionesComunicado(serializers.ModelSerializer):
    publicado_por_username = serializers.ReadOnlyField(source='publicado_por.username')

    class Meta:
        model = ComunicacionesComunicado
        fields = "__all__"


class WriteSerializerComunicacionesComunicado(serializers.ModelSerializer):
    DESTINATARIOS_VALIDOS = {'estudiantes', 'encargados'}
    TIPOS_VALIDOS = {
        'informativo',
        'urgente',
        'evento',
        'aviso',
        'felicitacion',
        'tarea',
        'cambio',
    }

    class Meta:
        model = ComunicacionesComunicado
        fields = [
            'id',
            'titulo',
            'contenido',
            'tipo_comunicado',
            'destinatarios',
            'fecha_publicacion',
            'fecha_vigencia',
            'visible',
            'publicado_por',
        ]
        read_only_fields = ['id', 'fecha_publicacion', 'publicado_por']

    def validate_tipo_comunicado(self, value):
        value_normalizado = (value or '').strip().lower()
        if value_normalizado not in self.TIPOS_VALIDOS:
            raise serializers.ValidationError('Tipo de comunicado no válido.')
        return value_normalizado

    def validate_destinatarios(self, value):
        if not isinstance(value, list) or not value:
            raise serializers.ValidationError('Debe seleccionar al menos un destinatario.')

        normalizados = []
        for item in value:
            destino = str(item).strip().lower()
            if destino not in self.DESTINATARIOS_VALIDOS:
                raise serializers.ValidationError('Destinatario inválido. Use estudiantes o encargados.')
            normalizados.append(destino)

        return sorted(list(set(normalizados)))

    def validate_fecha_vigencia(self, value):
        if value and value < timezone.now():
            raise serializers.ValidationError('La fecha de vigencia no puede estar en el pasado.')
        return value

#Necesario para registrarse
class RegistroSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(write_only=True)
    primer_apellido = serializers.CharField(write_only=True)
    segundo_apellido = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    fecha_nacimiento = serializers.DateField(write_only=True)
    genero = serializers.CharField(write_only=True)
    rol = serializers.CharField(write_only=True, required=False, default='estudiante')
    
    class Meta:
        model = AuthUsuario
        fields = [
            'username', 'email', 'password', 'nombre', 
            'primer_apellido', 'segundo_apellido', 'fecha_nacimiento', 'genero', 'rol'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        nombre = validated_data.pop('nombre')
        primer_apellido = validated_data.pop('primer_apellido')
        segundo_apellido = validated_data.pop('segundo_apellido', '')
        fecha_nacimiento = validated_data.pop('fecha_nacimiento')
        genero = validated_data.pop('genero')
        rol_nombre = validated_data.pop('rol', 'estudiante')
        email = validated_data.get('email', '')

        validated_data['password'] = make_password(validated_data['password'])

        with transaction.atomic():
            persona = PersonasPersona.objects.create(
                nombre=nombre,
                primer_apellido=primer_apellido,
                segundo_apellido=segundo_apellido,
                fecha_nacimiento=fecha_nacimiento,
                genero=genero,
                identificacion=validated_data.get('username'),
                tipo_identificacion='cedula',
                nacionalidad='costarricense',
                telefono_principal='00000000',
                telefono_secundario='',
                email_personal=email,
                email_institucional=email,
                direccion_exacta='No especificada',
                provincia='No especificada',
                canton='No especificado',
                distrito='No especificado',
                estado_civil='No especificado',
                notas='',
                fecha_modificacion=timezone.now(),
            )

            usuario = AuthUsuario.objects.create(
                persona=persona,
                **validated_data
            )

            # Asignar rol al usuario
            try:
                from .models import AuthRol, AuthUsuarioRol

                rol = AuthRol.objects.filter(nombre__iexact=rol_nombre).first()
                if rol:
                    AuthUsuarioRol.objects.create(
                        usuario=usuario,
                        rol=rol,
                        fecha_asignacion=timezone.now()
                    )
            except Exception:
                pass

            return usuario


class EstudiantePersonaSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = PersonasPersona
        fields = [
            'id',
            'identificacion',
            'nombre',
            'primer_apellido',
            'segundo_apellido',
            'nombre_completo',
            'email_personal',
            'email_institucional'
        ]

    def get_nombre_completo(self, obj):
        return f"{obj.nombre} {obj.primer_apellido} {obj.segundo_apellido or ''}".strip()


class EstudianteListadoSerializer(serializers.ModelSerializer):
    persona_info = EstudiantePersonaSerializer(source='usuario.persona', read_only=True)
    persona_id = serializers.IntegerField(source='usuario.persona.id', read_only=True)
    usuario_id = serializers.IntegerField(source='usuario.id', read_only=True)
    username = serializers.CharField(source='usuario.username', read_only=True)
    email = serializers.CharField(source='usuario.email', read_only=True)
    codigo_estudiante = serializers.SerializerMethodField()
    estado_estudiante = serializers.SerializerMethodField()
    tipo_estudiante = serializers.SerializerMethodField()

    class Meta:
        model = AuthUsuarioRol
        fields = [
            'usuario_id',
            'username',
            'email',
            'persona_id',
            'persona_info',
            'codigo_estudiante',
            'estado_estudiante',
            'tipo_estudiante'
        ]

    def _get_persona_id(self, obj):
        persona = getattr(obj.usuario, 'persona', None)
        return persona.id if persona else None

    def _get_estudiante_record(self, obj):
        persona_id = self._get_persona_id(obj)
        if not persona_id:
            return None
        return PersonasEstudiante.objects.filter(persona_id=persona_id).first()

    def get_codigo_estudiante(self, obj):
        estudiante = self._get_estudiante_record(obj)
        return estudiante.codigo_estudiante if estudiante else None

    def get_estado_estudiante(self, obj):
        estudiante = self._get_estudiante_record(obj)
        return estudiante.estado_estudiante if estudiante else None

    def get_tipo_estudiante(self, obj):
        estudiante = self._get_estudiante_record(obj)
        return estudiante.tipo_estudiante if estudiante else None