from rest_framework import serializers
from apps.databaseModels.models import (
    EvaluacionesEvaluacion,
    EvaluacionesCalificacion,
    PersonasEstudiante,
)


class EstudianteSimpleSerializer(serializers.ModelSerializer):
    persona_id = serializers.IntegerField(read_only=True)
    nombre = serializers.SerializerMethodField()
    codigo_estudiante = serializers.CharField(read_only=True)

    def get_nombre(self, obj):
        persona = getattr(obj, 'persona', None)
        if not persona:
            return 'N/A'
        return f"{persona.nombre} {persona.primer_apellido} {persona.segundo_apellido or ''}".strip()
    
    class Meta:
        model = PersonasEstudiante
        fields = ['persona_id', 'nombre', 'codigo_estudiante']


class EvaluacionesCalificacionSerializer(serializers.ModelSerializer):
    estudiante = EstudianteSimpleSerializer(read_only=True)
    
    class Meta:
        model = EvaluacionesCalificacion
        fields = [
            'id',
            'evaluacion',
            'estudiante',
            'nota',
            'estado',
            'ausente',
            'justificado',
            'observaciones',
            'fecha_registro',
        ]
        read_only_fields = ['fecha_registro']


class EvaluacionesEvaluacionSerializer(serializers.ModelSerializer):
    calificaciones = EvaluacionesCalificacionSerializer(
        source='evaluacionescalificacion_set',
        many=True,
        read_only=True
    )
    
    class Meta:
        model = EvaluacionesEvaluacion
        fields = [
            'id',
            'docente_grupo',
            'nombre',
            'descripcion',
            'tipo_evaluacion',
            'fecha_evaluacion',
            'fecha_entrega',
            'valor_porcentual',
            'nota_maxima',
            'rubrica',
            'instrucciones',
            'visible_estudiantes',
            'permite_recuperacion',
            'fecha_creacion',
            'fecha_modificacion',
            'calificaciones',
        ]
        read_only_fields = ['fecha_creacion', 'fecha_modificacion']


class EvaluacionesEvaluacionCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluacionesEvaluacion
        fields = [
            'docente_grupo',
            'nombre',
            'descripcion',
            'tipo_evaluacion',
            'fecha_evaluacion',
            'fecha_entrega',
            'valor_porcentual',
            'nota_maxima',
            'rubrica',
            'instrucciones',
            'visible_estudiantes',
            'permite_recuperacion',
        ]
