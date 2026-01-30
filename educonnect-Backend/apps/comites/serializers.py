from rest_framework import serializers
from apps.databaseModels.models import ComitesComite, ComitesMiembro, PersonasPersona
from django.utils import timezone


class PersonaSimpleSerializer(serializers.ModelSerializer):
    """Serializer simple para información de personas"""
    nombre_completo = serializers.SerializerMethodField()
    
    class Meta:
        model = PersonasPersona
        fields = [
            'id',
            'nombre',
            'primer_apellido',
            'segundo_apellido',
            'nombre_completo',
            'email_personal',
            'email_institucional'
        ]
        
    def get_nombre_completo(self, obj):
        return f"{obj.nombre} {obj.primer_apellido} {obj.segundo_apellido or ''}".strip()


class ComitesMiembroSerializer(serializers.ModelSerializer):
    """Serializer para miembros de comités"""
    persona_info = PersonaSimpleSerializer(source='persona', read_only=True)
    persona_id = serializers.PrimaryKeyRelatedField(
        queryset=PersonasPersona.objects.all(),
        source='persona',
        write_only=True
    )
    
    class Meta:
        model = ComitesMiembro
        fields = [
            'id', 'persona_id', 'persona_info', 'cargo',
            'fecha_nombramiento', 'fecha_cese', 'activo'
        ]
        read_only_fields = ['id']

    def validate(self, data):
        """Validar que no exista un miembro duplicado en el mismo comité"""
        comite = self.context.get('comite')
        persona = data.get('persona')
        cargo = data.get('cargo')
        
        # Si estamos actualizando, excluir el registro actual
        instance = self.instance
        queryset = ComitesMiembro.objects.filter(
            comite=comite,
            persona=persona,
            cargo=cargo
        )
        
        if instance:
            queryset = queryset.exclude(pk=instance.pk)
            
        if queryset.exists():
            raise serializers.ValidationError(
                "Esta persona ya tiene el mismo cargo en este comité"
            )
        
        return data


class ComitesComiteSerializer(serializers.ModelSerializer):
    """Serializer principal para comités"""
    miembros = ComitesMiembroSerializer(many=True, read_only=True, source='comitesmiembro_set')
    total_miembros = serializers.SerializerMethodField()
    
    class Meta:
        model = ComitesComite
        fields = [
            'id', 'nombre', 'tipo_comite', 'descripcion', 'objetivos',
            'periodo', 'fecha_creacion', 'fecha_disolucion', 'estado',
            'reglamento', 'miembros', 'total_miembros'
        ]
        read_only_fields = ['id', 'fecha_creacion']
        
    def get_total_miembros(self, obj):
        """Contar miembros activos del comité"""
        return obj.comitesmiembro_set.filter(activo=True).count()
    
    def validate_nombre(self, value):
        """Validar que el nombre del comité sea único (excepto al actualizar)"""
        queryset = ComitesComite.objects.filter(nombre__iexact=value)
        
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
            
        if queryset.exists():
            raise serializers.ValidationError("Ya existe un comité con este nombre")
        
        return value
    
    def validate(self, data):
        """Validaciones adicionales"""
        fecha_disolucion = data.get('fecha_disolucion')
        fecha_creacion = data.get('fecha_creacion', 
                                   self.instance.fecha_creacion if self.instance else timezone.now().date())
        
        if fecha_disolucion and fecha_disolucion < fecha_creacion:
            raise serializers.ValidationError({
                'fecha_disolucion': 'La fecha de disolución no puede ser anterior a la fecha de creación'
            })
        
        return data


class ComitesComiteCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear comités con miembros"""
    miembros = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = ComitesComite
        fields = [
            'nombre', 'tipo_comite', 'descripcion', 'objetivos',
            'periodo', 'estado', 'reglamento', 'miembros'
        ]
    
    def create(self, validated_data):
        miembros_data = validated_data.pop('miembros', [])
        
        # Establecer fecha_creacion
        validated_data['fecha_creacion'] = timezone.now().date()
        
        comite = ComitesComite.objects.create(**validated_data)
        
        # Crear miembros si se proporcionaron
        for miembro_data in miembros_data:
            ComitesMiembro.objects.create(
                comite=comite,
                persona_id=miembro_data.get('persona_id'),
                cargo=miembro_data.get('cargo', 'Miembro'),
                fecha_nombramiento=miembro_data.get('fecha_nombramiento', timezone.now().date()),
                activo=True
            )
        
        return comite
