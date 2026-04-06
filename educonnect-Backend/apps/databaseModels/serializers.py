from rest_framework import serializers
from .models import * 
from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.utils import timezone
from django.conf import settings
import json
from apps.databaseModels.comunicaciones.circulares.serializers import (
    ReadSerializerComunicacionesCircular,
    WriteSerializerComunicacionesCircular,
)
from datetime import timedelta


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
            # Caso clásico: "estudiantes" / "encargados"
            if isinstance(item, str):
                destino = item.strip().lower()
                if destino not in self.DESTINATARIOS_VALIDOS:
                    raise serializers.ValidationError(
                        'Destinatario inválido. Use estudiantes, encargados o profesor_hogar.'
                    )
                normalizados.append(destino)
                continue

            # Caso nuevo: {"tipo": "profesor_hogar", "grupo_id": 1}
            if isinstance(item, dict):
                tipo = str(item.get('tipo', '')).strip().lower()
                grupo_id = item.get('grupo_id')

                if tipo != 'profesor_hogar':
                    raise serializers.ValidationError(
                        "El objeto destinatario solo permite tipo='profesor_hogar'."
                    )

                if grupo_id in [None, '', 0]:
                    raise serializers.ValidationError(
                        "Para profesor_hogar debe indicar grupo_id."
                    )

                try:
                    grupo_id = int(grupo_id)
                except (TypeError, ValueError):
                    raise serializers.ValidationError(
                        "grupo_id debe ser numérico."
                    )

                if grupo_id <= 0:
                    raise serializers.ValidationError(
                        "grupo_id debe ser mayor que 0."
                    )

                normalizados.append({
                    'tipo': 'profesor_hogar',
                    'grupo_id': grupo_id
                })
                continue

            raise serializers.ValidationError(
                'Formato inválido en destinatarios.'
            )

        return normalizados

    def validate_fecha_vigencia(self, value):
        # Allow a small tolerance window because HTML datetime-local rounds to minutes.
        if value and value < (timezone.now() - timedelta(minutes=1)):
            raise serializers.ValidationError('La fecha de vigencia no puede estar en el pasado.')
        return value

#Necesario para registrarse
class RegistroSerializer(serializers.ModelSerializer):
    DEFAULT_ALLOWED_EMAIL_DOMAINS = ['test.com', 'educonnect.ac.cr']
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

    def validate_email(self, value):
        email = str(value or '').strip().lower()
        if '@' not in email:
            raise serializers.ValidationError('Correo electrónico inválido.')

        allowed_domains = getattr(
            settings,
            'AUTH_ALLOWED_EMAIL_DOMAINS',
            self.DEFAULT_ALLOWED_EMAIL_DOMAINS,
        )
        normalized_domains = {
            str(domain).strip().lower().lstrip('@')
            for domain in (allowed_domains or [])
            if str(domain).strip()
        }

        if normalized_domains:
            email_domain = email.split('@', 1)[1]
            if email_domain not in normalized_domains:
                domains_text = ', '.join(sorted(f'@{domain}' for domain in normalized_domains))
                raise serializers.ValidationError(
                    f'Dominio no permitido. Use un correo institucional: {domains_text}.'
                )

        return email

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

            # Determinar rol segun dominio del correo
            email = validated_data.get('email', '').lower()
            email_domain = email.split('@', 1)[1] if '@' in email else ''

            student_domain = getattr(
                settings, 'AUTH_STUDENT_EMAIL_DOMAIN', 'est.mep.go.cr'
            ).lower()
            teacher_domain = getattr(
                settings, 'AUTH_TEACHER_EMAIL_DOMAIN', 'mep.go.cr'
            ).lower()

            if email_domain == student_domain:
                rol_nombre = 'estudiante'
            elif email_domain == teacher_domain:
                rol_nombre = 'docente'
            # Si llego un rol explicito en el payload y no es
            # ninguno de los dos dominios conocidos, respetarlo.
            # (Para casos de desarrollo o dominios futuros)

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
    grupos = serializers.SerializerMethodField()

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
            'tipo_estudiante',
            'grupos'
        ]

    def _get_persona_id(self, obj):
        persona = getattr(obj.usuario, 'persona', None)
        return persona.id if persona else None

    def _get_estudiante_record(self, obj):
        persona_id = self._get_persona_id(obj)
        if not persona_id:
            return None
        if not hasattr(self, '_estudiante_cache'):
            self._estudiante_cache = {}
        if persona_id in self._estudiante_cache:
            return self._estudiante_cache[persona_id]

        estudiante = PersonasEstudiante.objects.filter(persona_id=persona_id).first()
        self._estudiante_cache[persona_id] = estudiante
        return estudiante

    def get_codigo_estudiante(self, obj):
        estudiante = self._get_estudiante_record(obj)
        return estudiante.codigo_estudiante if estudiante else None

    def get_estado_estudiante(self, obj):
        estudiante = self._get_estudiante_record(obj)
        return estudiante.estado_estudiante if estudiante else None

    def get_tipo_estudiante(self, obj):
        estudiante = self._get_estudiante_record(obj)
        return estudiante.tipo_estudiante if estudiante else None

    def get_grupos(self, obj):
        estudiante = self._get_estudiante_record(obj)
        if not estudiante:
            return []

        matriculas = AcademicoMatricula.objects.select_related('grupo', 'grupo__seccion').filter(estudiante=estudiante)
        grupos = []
        vistos = set()

        for matricula in matriculas:
            grupo = getattr(matricula, 'grupo', None)
            if not grupo or grupo.id in vistos:
                continue
            vistos.add(grupo.id)

            seccion = getattr(getattr(grupo, 'seccion', None), 'nombre', None)
            nombre = grupo.nombre or grupo.codigo_grupo or f'Grupo {grupo.id}'

            grupos.append({
                'id': grupo.id,
                'nombre': nombre,
                'codigo_grupo': grupo.codigo_grupo,
                'seccion': seccion,
                'label': nombre
            })

        return grupos