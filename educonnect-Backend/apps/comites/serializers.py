from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from apps.databaseModels.models import (
    ComitesComite,
    ComitesMiembro,
    ComitesActa,
    ComitesInformeOrgano,
    PersonasPersona,
    PersonasDocente,
    AuthRol,
    AuthUsuarioRol,
    DocumentosDocumento,
)
from django.utils import timezone
from django.db import transaction


COMITE_CARGOS_PERMITIDOS = {
    'presidente': 'Presidente',
    'secretario': 'Secretario',
    'tesorero': 'Tesorero',
    'vocal': 'Vocal',
    'miembro': 'Miembro',
}


def _ensure_committee_role_for_persona(persona, asignado_por=None):
    usuario = getattr(persona, 'authusuario', None)
    if not usuario:
        return

    rol_comite = AuthRol.objects.filter(nombre__iexact='comite', activo=True).first()
    if not rol_comite:
        return

    AuthUsuarioRol.objects.get_or_create(
        usuario=usuario,
        rol=rol_comite,
        defaults={
            'fecha_asignacion': timezone.now(),
            'asignado_por': asignado_por,
        }
    )


def _remove_committee_role_if_unused(persona):
    usuario = getattr(persona, 'authusuario', None)
    if not usuario:
        return

    if ComitesMiembro.objects.filter(persona=persona, activo=True).exists():
        return

    AuthUsuarioRol.objects.filter(
        usuario=usuario,
        rol__nombre__iexact='comite'
    ).delete()


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
    cargo = serializers.CharField(required=False, default='Miembro')
    fecha_nombramiento = serializers.DateField(required=False, default=timezone.localdate)
    activo = serializers.BooleanField(required=False, default=True)
    
    class Meta:
        model = ComitesMiembro
        fields = [
            'id', 'persona_id', 'persona_info', 'cargo',
            'fecha_nombramiento', 'fecha_cese', 'activo'
        ]
        read_only_fields = ['id']

    def _normalizar_cargo(self, cargo):
        cargo_normalizado = str(cargo or '').strip().lower()
        return COMITE_CARGOS_PERMITIDOS.get(cargo_normalizado)

    def _persona_es_docente(self, persona):
        email = str(getattr(persona, 'email_institucional', '') or '').strip().lower()
        if not email.endswith('@mep.go.cr'):
            return False
        return PersonasDocente.objects.filter(persona=persona).exists()

    def validate(self, data):
        """Validar que no exista un miembro duplicado en el mismo comité"""
        comite = self.context.get('comite')
        persona = data.get('persona') or getattr(self.instance, 'persona', None)
        cargo = self._normalizar_cargo(data.get('cargo') or getattr(self.instance, 'cargo', None) or 'Miembro')

        if not comite and self.instance:
            comite = self.instance.comite

        if not comite:
            raise serializers.ValidationError({'comite': 'Se requiere un comité válido.'})

        if not persona:
            raise serializers.ValidationError({'persona_id': 'Se requiere una persona válida.'})

        if not cargo:
            raise serializers.ValidationError({
                'cargo': 'Cargo no válido. Use presidente, secretario, tesorero, vocal o miembro.'
            })

        if not self._persona_es_docente(persona):
            raise serializers.ValidationError({
                'persona_id': 'Solo se pueden asignar docentes con correo institucional @mep.go.cr.'
            })

        data['cargo'] = cargo
        
        # Si estamos actualizando, excluir el registro actual
        instance = self.instance
        queryset = ComitesMiembro.objects.filter(
            comite=comite,
            persona=persona,
        )
        
        if instance:
            queryset = queryset.exclude(pk=instance.pk)
            
        if queryset.exists():
            raise serializers.ValidationError('Esta persona ya pertenece a este comité.')
        
        # Validar que solo haya un presidente o secretario activo por comité
        if cargo and cargo.lower() in ['presidente', 'secretario']:
            activo = data.get('activo', True if not instance else instance.activo)
            
            if activo:
                # Buscar si ya existe otro miembro con ese cargo activo
                existing = ComitesMiembro.objects.filter(
                    comite=comite,
                    cargo__iexact=cargo,
                    activo=True
                )
                
                if instance:
                    existing = existing.exclude(pk=instance.pk)
                
                if existing.exists():
                    raise serializers.ValidationError(
                        f"Ya existe un {cargo.lower()} activo en este comité. Debe cesar al actual antes de asignar uno nuevo."
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
        request = self.context.get('request')
        
        # Establecer fecha_creacion
        validated_data['fecha_creacion'] = timezone.now().date()

        with transaction.atomic():
            comite = ComitesComite.objects.create(**validated_data)

            # Crear miembros si se proporcionaron
            for miembro_data in miembros_data:
                serializer = ComitesMiembroSerializer(
                    data=miembro_data,
                    context={'comite': comite}
                )
                serializer.is_valid(raise_exception=True)
                miembro = serializer.save(comite=comite)
                _ensure_committee_role_for_persona(miembro.persona, asignado_por=request.user if request else None)

        return comite


class ComitesActaSerializer(serializers.ModelSerializer):
    elaborada_por_username = serializers.ReadOnlyField(source='elaborada_por.username')
    archivo_url = serializers.SerializerMethodField()
    archivo_nombre = serializers.SerializerMethodField()

    def _last_file(self, obj):
        content_type = ContentType.objects.get_for_model(ComitesActa)
        return (
            DocumentosDocumento.objects.filter(
                content_type=content_type,
                object_id=obj.id,
                es_version_actual=True,
            )
            .order_by('-fecha_carga')
            .first()
        )

    def get_archivo_url(self, obj):
        documento = self._last_file(obj)
        return documento.ruta_archivo if documento else None

    def get_archivo_nombre(self, obj):
        documento = self._last_file(obj)
        return documento.nombre if documento else None

    class Meta:
        model = ComitesActa
        fields = [
            'id',
            'reunion',
            'numero_acta',
            'contenido',
            'acuerdos',
            'seguimientos',
            'estado',
            'elaborada_por',
            'elaborada_por_username',
            'archivo_url',
            'archivo_nombre',
            'aprobada_por',
            'fecha_elaboracion',
            'fecha_aprobacion',
        ]
        read_only_fields = ['id', 'elaborada_por', 'fecha_elaboracion', 'aprobada_por', 'fecha_aprobacion']

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data.setdefault('estado', 'borrador')
        validated_data['fecha_elaboracion'] = timezone.now()
        if request and request.user.is_authenticated:
            validated_data['elaborada_por'] = request.user
        return super().create(validated_data)


class ComitesInformeOrganoSerializer(serializers.ModelSerializer):
    elaborado_por_username = serializers.ReadOnlyField(source='elaborado_por.username')

    class Meta:
        model = ComitesInformeOrgano
        fields = [
            'id',
            'organo',
            'periodo',
            'tipo_informe',
            'titulo',
            'contenido',
            'conclusiones',
            'recomendaciones',
            'archivo_adjunto',
            'elaborado_por',
            'elaborado_por_username',
            'fecha_elaboracion',
            'fecha_presentacion',
            'estado',
        ]
        read_only_fields = ['id', 'elaborado_por', 'fecha_elaboracion']

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data.setdefault('estado', 'borrador')
        validated_data.setdefault('tipo_informe', 'reporte_comite')
        validated_data['fecha_elaboracion'] = timezone.now().date()
        if request and request.user.is_authenticated:
            validated_data['elaborado_por'] = request.user
        return super().create(validated_data)
