from django.db import transaction
from django.db.models import Q
from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers
from apps.databaseModels.models import HorariosAprobacion,HorariosDetalle,HorariosHorario, DocumentosDocumento
from .services import HorarioNotificationService

class HorariosDetalleReadSerializer(serializers.ModelSerializer):
    grupo = serializers.StringRelatedField()
    class Meta:
        model = HorariosDetalle
        fields = '__all__'

class HorariosAprobacionReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = HorariosAprobacion
        fields = '__all__'

class ReadSerializerHorariosHorario(serializers.ModelSerializer):
    detalles = HorariosDetalleReadSerializer(many=True, read_only=True, source='horariosdetalle_set')
    aprobaciones = HorariosAprobacionReadSerializer(many=True, read_only=True, source='horariosaprobacion_set')
    docente_info = serializers.SerializerMethodField()
    documento_adjunto = serializers.SerializerMethodField()

    class Meta:
        model = HorariosHorario
        fields = [
            'id', 'nombre', 'grupo', 'docente', 'docente_info', 'tipo_horario', 
            'version', 'estado', 'fecha_vigencia_inicio', 
            'fecha_vigencia_fin', 'notas', 'detalles', 'aprobaciones', 'documento_adjunto'
        ]

    def get_docente_info(self, obj):
        if obj.docente:
            persona = getattr(obj.docente, 'persona', None)
            return {
                "id": obj.docente.id,
                "nombre": f"{persona.nombre} {persona.primer_apellido}" if persona else obj.docente.username
            }
        return None

    def get_documento_adjunto(self, obj):
        ct = ContentType.objects.get_for_model(HorariosHorario)
        documento = DocumentosDocumento.objects.filter(
            content_type=ct,
            object_id=obj.id,
            es_version_actual=True,
        ).order_by('-fecha_carga').first()

        if not documento:
            return None

        ruta = documento.ruta_archivo or ''
        partes = ruta.split('/upload/')
        url_descarga = f"{partes[0]}/upload/fl_attachment/{partes[1]}" if len(partes) == 2 else ruta

        return {
            'id': documento.id,
            'nombre': documento.nombre,
            'url_descarga': url_descarga,
            'ruta_archivo': ruta,
            'fecha_carga': documento.fecha_carga,
        }

class HorariosDetalleWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = HorariosDetalle
        fields = ['dia_semana', 'hora_inicio', 'hora_fin', 'asignatura', 'docente', 'aula', 'notas']

class HorariosAprobacionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = HorariosAprobacion
        fields = ['aprobador', 'nivel_aprobacion', 'estado_aprobacion', 'fecha_revision', 'comentarios']

class WriteSerializerHorariosHorario(serializers.ModelSerializer):
    detalles = HorariosDetalleWriteSerializer(many=True, required=False, default=[])
    aprobaciones = HorariosAprobacionWriteSerializer(many=True, required=False, default=[])

    class Meta:
        model = HorariosHorario
        fields = '__all__'

    def validate(self, attrs):
        detalles = attrs.get('detalles', [])
        horario_id = self.instance.id if self.instance else None

        for d in detalles:
            self._validar_traslape(d, 'docente', d.get('docente'), horario_id)
            self._validar_traslape(d, 'aula', d.get('aula'), horario_id)
            
        return attrs

    def _validar_traslape(self, d, campo, valor, exclude_id):
        if not valor:
            return

        filtros = Q(**{
            'dia_semana': d.get('dia_semana'),
            f'{campo}': valor,
            'hora_inicio__lt': d.get('hora_fin'),
            'hora_fin__gt': d.get('hora_inicio')
        })

        query = HorariosDetalle.objects.filter(filtros)
        if exclude_id:
            query = query.exclude(horario_id=exclude_id)

        if query.exists():
            raise serializers.ValidationError(
                f"Conflicto en {campo}: {valor} ya tiene una asignación el {d.get('dia_semana')} de {d.get('hora_inicio')} a {d.get('hora_fin')}."
            )

    @transaction.atomic
    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles', [])
        aprobaciones_data = validated_data.pop('aprobaciones', [])

        horario = HorariosHorario.objects.create(**validated_data)

        if detalles_data:
            self._process_detalles_bulk(horario, detalles_data)

        if aprobaciones_data:
            self._process_aprobaciones_bulk(horario, aprobaciones_data)

        return horario

    @transaction.atomic
    def update(self, instance, validated_data):
        detalles_data = validated_data.pop('detalles', None)
        aprobaciones_data = validated_data.pop('aprobaciones', None)

        es_publicado = instance.estado == 'Publicado'
        cambios_detectados = False

        if detalles_data is not None and es_publicado:
            detalles_antiguos = list(HorariosDetalle.objects.filter(horario=instance).values(
                'dia_semana', 'hora_inicio', 'hora_fin', 'aula'
            ))
            
            if len(detalles_antiguos) != len(detalles_data):
                cambios_detectados = True
            else:
                for i in range(len(detalles_data)):
                    inicio_antiguo = str(detalles_antiguos[i]['hora_inicio'])[:5]
                    inicio_nuevo = str(detalles_data[i]['hora_inicio'])[:5]
                    
                    if (inicio_antiguo != inicio_nuevo or 
                        detalles_antiguos[i]['dia_semana'] != detalles_data[i]['dia_semana'] or
                        detalles_antiguos[i]['aula'] != detalles_data[i]['aula']):
                        cambios_detectados = True
                        break

        if cambios_detectados:
            instance.version += 1

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if detalles_data is not None:
            HorariosDetalle.objects.filter(horario=instance).delete()
            self._process_detalles_bulk(instance, detalles_data)
            
        if cambios_detectados:
            transaction.on_commit(lambda: HorarioNotificationService.enviar_aviso_cambio(instance))

        return instance
    
    def _process_detalles_bulk(self, horario, detalles_data):
        HorariosDetalle.objects.bulk_create([
            HorariosDetalle(horario=horario, **d) for d in detalles_data
        ])

    def _process_aprobaciones_bulk(self, horario, aprobaciones_data):
        HorariosAprobacion.objects.bulk_create([
            HorariosAprobacion(horario=horario, **a) for a in aprobaciones_data
        ])