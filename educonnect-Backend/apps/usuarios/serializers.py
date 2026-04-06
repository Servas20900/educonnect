from rest_framework import serializers
from apps.databaseModels.models import (
    PersonasDocente,
    PersonasEstudiante,
    PersonasPersona,
    AuthUsuario,
    AuthUsuarioRol,
    AcademicoGrado,
    AcademicoGrupo,
    AcademicoMatricula,
)
from django.contrib.auth.models import User


class PersonaSerializerMini(serializers.ModelSerializer):
    """Serializador mínimo de Persona para referencias"""
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = PersonasPersona
        fields = ['id', 'nombre', 'primer_apellido', 'segundo_apellido', 'identificacion', 'nombre_completo']

    def get_nombre_completo(self, obj):
        return f"{obj.nombre} {obj.primer_apellido} {obj.segundo_apellido}".strip()


class DocenteSerializer(serializers.ModelSerializer):
    """Serializador completo para Docentes"""
    persona = PersonaSerializerMini()
    nombre = serializers.CharField(source='persona.nombre', read_only=True)
    primer_apellido = serializers.CharField(source='persona.primer_apellido', read_only=True)
    segundo_apellido = serializers.CharField(source='persona.segundo_apellido', read_only=True)
    identificacion = serializers.CharField(source='persona.identificacion', read_only=True)
    email_institucional = serializers.CharField(source='persona.email_institucional', read_only=True)
    email_personal = serializers.CharField(source='persona.email_personal', read_only=True)
    telefono_principal = serializers.CharField(source='persona.telefono_principal', read_only=True)

    class Meta:
        model = PersonasDocente
        fields = [
            'persona', 'codigo_empleado', 'especialidad', 'nivel_academico',
            'fecha_ingreso', 'fecha_salida', 'estado_laboral', 'tipo_contrato',
            'horas_contratadas', 'salario_base', 'numero_cuenta_bancaria',
            'titulo_profesional', 'universidad', 'año_graduacion',
            'nombre', 'primer_apellido', 'segundo_apellido', 'identificacion',
            'email_institucional', 'email_personal', 'telefono_principal'
        ]
        read_only_fields = ['codigo_empleado']


class EstudianteSerializer(serializers.ModelSerializer):
    """Serializador completo para Estudiantes"""
    persona = PersonaSerializerMini()
    nombre = serializers.CharField(source='persona.nombre', read_only=True)
    primer_apellido = serializers.CharField(source='persona.primer_apellido', read_only=True)
    segundo_apellido = serializers.CharField(source='persona.segundo_apellido', read_only=True)
    identificacion = serializers.CharField(source='persona.identificacion', read_only=True)
    email_institucional = serializers.CharField(source='persona.email_institucional', read_only=True)
    email_personal = serializers.CharField(source='persona.email_personal', read_only=True)
    telefono_principal = serializers.CharField(source='persona.telefono_principal', read_only=True)
    grupo_actual = serializers.SerializerMethodField()

    class Meta:
        model = PersonasEstudiante
        fields = [
            'persona', 'codigo_estudiante', 'fecha_ingreso', 'fecha_retiro',
            'estado_estudiante', 'tipo_estudiante', 'condicion_especial',
            'beca', 'tipo_beca', 'porcentaje_beca',
            'tiene_adecuacion', 'tipo_adecuacion',
            'nombre', 'primer_apellido', 'segundo_apellido', 'identificacion',
            'email_institucional', 'email_personal', 'telefono_principal',
            'grupo_actual'
        ]
        read_only_fields = ['codigo_estudiante']

    def get_grupo_actual(self, obj):
        try:
            matricula = AcademicoMatricula.objects.filter(
                estudiante=obj, estado='activo'
            ).select_related('grupo').latest('fecha_matricula')
            if matricula and matricula.grupo:
                return {
                    'id': matricula.grupo.id,
                    'nombre': matricula.grupo.nombre,
                    'codigo_grupo': matricula.grupo.codigo_grupo,
                    'grado': matricula.grupo.grado.nombre if matricula.grupo.grado else None
                }
        except AcademicoMatricula.DoesNotExist:
            pass
        return None


class GradoSerializer(serializers.ModelSerializer):
    """Serializador para Grados Académicos"""
    class Meta:
        model = AcademicoGrado
        fields = ['id', 'nombre', 'nivel', 'numero_grado', 'descripcion', 'activo']
        read_only_fields = ['id', 'nombre', 'nivel', 'numero_grado', 'descripcion', 'activo']


class GrupoSerializer(serializers.ModelSerializer):
    """Serializador para Grupos Académicos"""
    grado_nombre = serializers.CharField(source='grado.nombre', read_only=True)
    docente_guia_nombre = serializers.SerializerMethodField()
    cantidad_estudiantes = serializers.SerializerMethodField()
    aula = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = AcademicoGrupo
        fields = [
            'id', 'periodo', 'grado', 'grado_nombre', 'seccion',
            'docente_guia', 'docente_guia_nombre', 'nombre', 'codigo_grupo',
            'aula', 'estado', 'fecha_creacion', 'fecha_modificacion',
            'cantidad_estudiantes'
        ]

    def get_docente_guia_nombre(self, obj):
        if obj.docente_guia and obj.docente_guia.persona:
            persona = obj.docente_guia.persona
            return f"{persona.nombre} {persona.primer_apellido}".strip()
        return None

    def get_cantidad_estudiantes(self, obj):
        return AcademicoMatricula.objects.filter(
            grupo=obj, estado='activo'
        ).count()
