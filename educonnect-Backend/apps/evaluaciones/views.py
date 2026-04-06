from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from decimal import Decimal, InvalidOperation
from collections import defaultdict

from apps.databaseModels.models import (
    EvaluacionesEvaluacion,
    EvaluacionesCalificacion,
    AcademicoDocenteGrupo,
    AcademicoGrupo,
    PersonasDocente,
    PersonasEstudiante,
    AcademicoMatricula,
)
from .serializers import (
    EvaluacionesEvaluacionSerializer,
    EvaluacionesEvaluacionCreateUpdateSerializer,
    EvaluacionesCalificacionSerializer,
)


def _docente_candidate_ids(user):
    candidate_ids = set()
    persona_id = getattr(user, 'persona_id', None)
    if persona_id:
        candidate_ids.add(persona_id)
    if getattr(user, 'id', None):
        candidate_ids.add(user.id)
    return list(candidate_ids)


def _get_docente_ids_for_user(user):
    candidate_ids = _docente_candidate_ids(user)
    if not candidate_ids:
        return []
    docentes_ids = list(
        PersonasDocente.objects.filter(persona_id__in=candidate_ids).values_list('persona_id', flat=True)
    )
    return docentes_ids or candidate_ids


def _get_grupo_docente_or_none(docente_ids, grupo_id):
    if not docente_ids:
        return None

    return (
        AcademicoGrupo.objects.filter(
            Q(docente_guia_id__in=docente_ids)
            | Q(academicodocentegrupo__docente_id__in=docente_ids, academicodocentegrupo__activo=True),
            id=grupo_id,
            estado__iexact='activo',
        )
        .distinct()
        .first()
    )


def _resolve_or_create_docente_grupo(docente_ids, grupo):
    docente_grupo = AcademicoDocenteGrupo.objects.filter(
        grupo=grupo,
        docente_id__in=docente_ids,
        activo=True,
    ).order_by('id').first()
    if docente_grupo:
        return docente_grupo

    docente_id = getattr(grupo, 'docente_guia_id', None)
    if docente_id and docente_id in docente_ids:
        return AcademicoDocenteGrupo.objects.create(
            docente_id=docente_id,
            grupo=grupo,
            asignatura=None,
            horas_semanales=0,
            fecha_inicio=timezone.now().date(),
            fecha_fin=None,
            activo=True,
            fecha_asignacion=timezone.now(),
        )

    return None


def _to_decimal(value):
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None


def _nombre_estudiante(estudiante):
    persona = getattr(estudiante, 'persona', None)
    if not persona:
        return 'N/A'
    return f"{persona.nombre} {persona.primer_apellido} {persona.segundo_apellido or ''}".strip()


def _validate_nota_maxima_escala_100(nota_maxima):
    nota_maxima_decimal = _to_decimal(nota_maxima)
    if nota_maxima_decimal is None:
        return 'La nota máxima debe ser numérica.'
    if nota_maxima_decimal != Decimal('100'):
        return 'La nota máxima debe ser 100 para mantener la escala de calificación 0-100.'
    return None


def _validate_porcentaje_disponible(docente_grupo, fecha_evaluacion, valor_porcentual, exclude_evaluacion_id=None):
    if not fecha_evaluacion:
        return 'La fecha de evaluación es requerida.'

    porcentaje_decimal = _to_decimal(valor_porcentual)
    if porcentaje_decimal is None:
        return 'El valor porcentual debe ser numérico.'
    if porcentaje_decimal <= Decimal('0') or porcentaje_decimal > Decimal('100'):
        return 'El valor porcentual debe estar entre 0 y 100.'

    evaluaciones = EvaluacionesEvaluacion.objects.filter(
        docente_grupo=docente_grupo,
    )

    if exclude_evaluacion_id:
        evaluaciones = evaluaciones.exclude(id=exclude_evaluacion_id)

    acumulado = Decimal('0')
    for evaluacion in evaluaciones.only('valor_porcentual'):
        acumulado += evaluacion.valor_porcentual or Decimal('0')

    if acumulado + porcentaje_decimal > Decimal('100'):
        return f'La suma porcentual total de evaluaciones supera 100%. Acumulado actual: {acumulado}.'

    return None


def _porcentaje_logro(nota, nota_maxima):
    if nota is None:
        return None
    if not nota_maxima or nota_maxima <= Decimal('0'):
        return None
    return (nota / nota_maxima) * Decimal('100')


def _criticidad_por_entregables(promedio_entregables, no_entregadas, total_evaluaciones):
    if total_evaluaciones <= 0:
        return None

    if no_entregadas >= 2 or promedio_entregables < Decimal('50'):
        return 'rojo'
    if no_entregadas >= 1 or promedio_entregables < Decimal('70'):
        return 'naranja'
    if promedio_entregables < Decimal('80'):
        return 'amarillo'
    return None


def _orden_criticidad(criticidad):
    order = {
        'rojo': 0,
        'naranja': 1,
        'amarillo': 2,
    }
    return order.get(criticidad, 99)


class EvaluacionesEvaluacionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EvaluacionesEvaluacionSerializer

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return EvaluacionesEvaluacionCreateUpdateSerializer
        return EvaluacionesEvaluacionSerializer

    def get_queryset(self):
        docente_ids = _get_docente_ids_for_user(self.request.user)
        if not docente_ids:
            return EvaluacionesEvaluacion.objects.none()

        return EvaluacionesEvaluacion.objects.filter(
            docente_grupo__docente_id__in=docente_ids,
            docente_grupo__activo=True,
        ).select_related('docente_grupo')

    @action(detail=False, methods=['get'], url_path='grupo/(?P<grupo_id>[0-9]+)')
    def por_grupo(self, request, grupo_id=None):
        docente_ids = _get_docente_ids_for_user(request.user)
        grupo = _get_grupo_docente_or_none(docente_ids, grupo_id)

        if not grupo:
            return Response({'detail': 'Grupo no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        docentes_grupo = AcademicoDocenteGrupo.objects.filter(
            grupo_id=grupo_id,
            activo=True,
            docente_id__in=docente_ids
        ).values_list('id', flat=True)

        evaluaciones = EvaluacionesEvaluacion.objects.filter(
            docente_grupo_id__in=docentes_grupo
        ).select_related('docente_grupo')

        serializer = self.get_serializer(evaluaciones, many=True)
        return Response(serializer.data)

    @action(
        detail=False,
        methods=['get'],
        url_path='grupo/(?P<grupo_id>[0-9]+)/estudiantes/(?P<estudiante_id>[0-9]+)/calificaciones'
    )
    def calificaciones_por_estudiante(self, request, grupo_id=None, estudiante_id=None):
        docente_ids = _get_docente_ids_for_user(request.user)
        grupo = _get_grupo_docente_or_none(docente_ids, grupo_id)

        if not grupo:
            return Response({'detail': 'Grupo no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        try:
            estudiante = PersonasEstudiante.objects.select_related('persona').get(persona_id=estudiante_id)
        except PersonasEstudiante.DoesNotExist:
            return Response({'detail': 'Estudiante no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        matricula_activa = AcademicoMatricula.objects.filter(
            estudiante=estudiante,
            grupo_id=grupo_id,
            estado__iexact='activo',
        ).exists()
        if not matricula_activa:
            return Response(
                {'detail': 'El estudiante no pertenece activamente a este grupo.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        evaluaciones = EvaluacionesEvaluacion.objects.filter(
            docente_grupo__grupo_id=grupo_id,
            docente_grupo__docente_id__in=docente_ids,
            docente_grupo__activo=True,
        ).order_by('fecha_evaluacion', 'id')

        calificaciones = EvaluacionesCalificacion.objects.filter(
            evaluacion__in=evaluaciones,
            estudiante=estudiante,
        )
        calificaciones_map = {c.evaluacion_id: c for c in calificaciones}

        items = []
        total_porcentaje = Decimal('0')
        for evaluacion in evaluaciones:
            calificacion = calificaciones_map.get(evaluacion.id)
            nota = calificacion.nota if calificacion else None
            nota_maxima = evaluacion.nota_maxima or Decimal('0')
            valor = evaluacion.valor_porcentual or Decimal('0')

            aporte = Decimal('0')
            if nota is not None and nota_maxima > 0:
                aporte = (nota / nota_maxima) * valor
                total_porcentaje += aporte

            items.append({
                'evaluacion_id': evaluacion.id,
                'calificacion_id': calificacion.id if calificacion else None,
                'nombre': evaluacion.nombre,
                'tipo_evaluacion': evaluacion.tipo_evaluacion,
                'fecha_evaluacion': evaluacion.fecha_evaluacion,
                'valor_porcentual': float(valor),
                'nota_maxima': float(nota_maxima),
                'nota': float(nota) if nota is not None else None,
                'aporte_porcentual': round(float(aporte), 2),
            })

        return Response({
            'estudiante': {
                'persona_id': estudiante.persona_id,
                'nombre': _nombre_estudiante(estudiante),
                'codigo_estudiante': estudiante.codigo_estudiante,
            },
            'evaluaciones': items,
            'total_porcentaje': round(float(total_porcentaje), 2),
        })

    @action(detail=True, methods=['get'], url_path='calificaciones')
    def calificaciones(self, request, pk=None):
        docente_ids = _get_docente_ids_for_user(request.user)

        evaluacion = EvaluacionesEvaluacion.objects.filter(
            id=pk,
            docente_grupo__docente_id__in=docente_ids,
        ).first()

        if not evaluacion:
            return Response({'detail': 'Evaluación no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        calificaciones = EvaluacionesCalificacion.objects.filter(
            evaluacion_id=pk
        ).select_related('estudiante')

        serializer = EvaluacionesCalificacionSerializer(calificaciones, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='promedios/grupo/(?P<grupo_id>[0-9]+)')
    def promedios_por_grupo(self, request, grupo_id=None):
        docente_ids = _get_docente_ids_for_user(request.user)
        grupo = _get_grupo_docente_or_none(docente_ids, grupo_id)

        if not grupo:
            return Response({'detail': 'Grupo no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        matriculas = AcademicoMatricula.objects.select_related('estudiante').filter(
            grupo_id=grupo_id,
            estado__iexact='activo',
        )

        data = {}
        for matricula in matriculas:
            estudiante = matricula.estudiante
            if not estudiante:
                continue

            calificaciones = EvaluacionesCalificacion.objects.filter(
                estudiante=estudiante,
                evaluacion__docente_grupo__grupo_id=grupo_id,
                evaluacion__docente_grupo__docente_id__in=docente_ids,
                evaluacion__docente_grupo__activo=True,
            ).select_related('evaluacion')

            sem_1 = Decimal('0')
            sem_2 = Decimal('0')

            for calificacion in calificaciones:
                fecha = getattr(calificacion.evaluacion, 'fecha_evaluacion', None)
                if not fecha:
                    continue
                nota = calificacion.nota or Decimal('0')
                nota_maxima = calificacion.evaluacion.nota_maxima or Decimal('0')
                valor = calificacion.evaluacion.valor_porcentual or Decimal('0')
                if nota_maxima <= 0:
                    continue

                aporte = (nota / nota_maxima) * valor
                if fecha.month <= 6:
                    sem_1 += aporte
                else:
                    sem_2 += aporte

            promedio_sem_1 = round(float(sem_1), 2)
            promedio_sem_2 = round(float(sem_2), 2)
            promedio_final = round(float(sem_1 + sem_2), 2)

            data[str(estudiante.persona_id)] = {
                'promedio_semestre_1': promedio_sem_1,
                'promedio_semestre_2': promedio_sem_2,
                'promedio_final': promedio_final,
            }

        return Response(data)

    @action(detail=False, methods=['get'], url_path='riesgo/grupo/(?P<grupo_id>[0-9]+)')
    def riesgo_por_grupo(self, request, grupo_id=None):
        docente_ids = _get_docente_ids_for_user(request.user)
        grupo = _get_grupo_docente_or_none(docente_ids, grupo_id)

        if not grupo:
            return Response({'detail': 'Grupo no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        evaluaciones = list(
            EvaluacionesEvaluacion.objects.filter(
                docente_grupo__grupo_id=grupo_id,
                docente_grupo__docente_id__in=docente_ids,
                docente_grupo__activo=True,
            ).only('id', 'nota_maxima', 'valor_porcentual', 'nombre', 'tipo_evaluacion', 'fecha_evaluacion')
        )

        total_evaluaciones = len(evaluaciones)
        evaluaciones_by_id = {e.id: e for e in evaluaciones}

        matriculas = list(
            AcademicoMatricula.objects.select_related('estudiante__persona').filter(
                grupo_id=grupo_id,
                estado__iexact='activo',
            )
        )

        estudiantes = []
        for matricula in matriculas:
            estudiante = matricula.estudiante
            if estudiante:
                estudiantes.append(estudiante)

        if not estudiantes:
            return Response([])

        calificaciones = EvaluacionesCalificacion.objects.filter(
            evaluacion_id__in=evaluaciones_by_id.keys(),
            estudiante__in=estudiantes,
        ).select_related('evaluacion', 'estudiante')

        calificaciones_by_estudiante = defaultdict(dict)
        for item in calificaciones:
            calificaciones_by_estudiante[item.estudiante_id][item.evaluacion_id] = item

        response_data = []
        for estudiante in estudiantes:
            estudiante_calificaciones = calificaciones_by_estudiante.get(estudiante.pk, {})

            entregadas = 0
            no_entregadas = 0
            suma_logro_porcentual = Decimal('0')
            suma_ponderada = Decimal('0')
            bajas = 0

            for evaluacion in evaluaciones:
                calificacion = estudiante_calificaciones.get(evaluacion.id)
                nota = calificacion.nota if calificacion else None

                if nota is None:
                    no_entregadas += 1
                    continue

                entregadas += 1
                porcentaje_logro = _porcentaje_logro(nota, evaluacion.nota_maxima)
                if porcentaje_logro is None:
                    continue

                suma_logro_porcentual += porcentaje_logro
                suma_ponderada += (porcentaje_logro / Decimal('100')) * (evaluacion.valor_porcentual or Decimal('0'))
                if porcentaje_logro < Decimal('65'):
                    bajas += 1

            if entregadas > 0:
                promedio_entregables = suma_logro_porcentual / Decimal(str(entregadas))
            else:
                promedio_entregables = Decimal('0')

            criticidad = _criticidad_por_entregables(promedio_entregables, no_entregadas, total_evaluaciones)
            if not criticidad:
                continue

            response_data.append({
                'estudiante': {
                    'persona_id': estudiante.persona_id,
                    'nombre': _nombre_estudiante(estudiante),
                    'codigo_estudiante': estudiante.codigo_estudiante,
                },
                'criticidad': criticidad,
                'total_evaluaciones': total_evaluaciones,
                'entregadas': entregadas,
                'no_entregadas': no_entregadas,
                'bajas': bajas,
                'promedio_entregables': round(float(promedio_entregables), 2),
                'promedio_ponderado': round(float(suma_ponderada), 2),
            })

        response_data.sort(
            key=lambda item: (
                _orden_criticidad(item['criticidad']),
                -item['no_entregadas'],
                item['promedio_entregables'],
                item['estudiante']['nombre'] or '',
            )
        )
        return Response(response_data)

    @action(
        detail=False,
        methods=['get'],
        url_path='riesgo/grupo/(?P<grupo_id>[0-9]+)/estudiantes/(?P<estudiante_id>[0-9]+)'
    )
    def detalle_riesgo_estudiante(self, request, grupo_id=None, estudiante_id=None):
        docente_ids = _get_docente_ids_for_user(request.user)
        grupo = _get_grupo_docente_or_none(docente_ids, grupo_id)

        if not grupo:
            return Response({'detail': 'Grupo no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        try:
            estudiante = PersonasEstudiante.objects.select_related('persona').get(persona_id=estudiante_id)
        except PersonasEstudiante.DoesNotExist:
            return Response({'detail': 'Estudiante no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        matricula_activa = AcademicoMatricula.objects.filter(
            estudiante=estudiante,
            grupo_id=grupo_id,
            estado__iexact='activo',
        ).exists()
        if not matricula_activa:
            return Response(
                {'detail': 'El estudiante no pertenece activamente a este grupo.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        evaluaciones = list(
            EvaluacionesEvaluacion.objects.filter(
                docente_grupo__grupo_id=grupo_id,
                docente_grupo__docente_id__in=docente_ids,
                docente_grupo__activo=True,
            ).order_by('fecha_evaluacion', 'id')
        )

        total_evaluaciones = len(evaluaciones)
        calificaciones = EvaluacionesCalificacion.objects.filter(
            evaluacion__in=evaluaciones,
            estudiante=estudiante,
        )
        calificaciones_map = {item.evaluacion_id: item for item in calificaciones}

        entregables = []
        entregadas = 0
        no_entregadas = 0
        bajas = 0
        suma_logro_porcentual = Decimal('0')
        suma_ponderada = Decimal('0')

        for evaluacion in evaluaciones:
            calificacion = calificaciones_map.get(evaluacion.id)
            nota = calificacion.nota if calificacion else None
            porcentaje_logro = _porcentaje_logro(nota, evaluacion.nota_maxima)

            if nota is None:
                no_entregadas += 1
                estado_entrega = 'no_entregado'
            else:
                entregadas += 1
                estado_entrega = 'entregado'
                if porcentaje_logro is not None:
                    suma_logro_porcentual += porcentaje_logro
                    suma_ponderada += (porcentaje_logro / Decimal('100')) * (evaluacion.valor_porcentual or Decimal('0'))
                    if porcentaje_logro < Decimal('65'):
                        bajas += 1

            entregables.append({
                'evaluacion_id': evaluacion.id,
                'nombre': evaluacion.nombre,
                'tipo_evaluacion': evaluacion.tipo_evaluacion,
                'fecha_evaluacion': evaluacion.fecha_evaluacion,
                'valor_porcentual': float(evaluacion.valor_porcentual or Decimal('0')),
                'nota_maxima': float(evaluacion.nota_maxima or Decimal('0')),
                'nota': float(nota) if nota is not None else None,
                'porcentaje_logro': round(float(porcentaje_logro), 2) if porcentaje_logro is not None else None,
                'estado_entrega': estado_entrega,
            })

        promedio_entregables = (
            suma_logro_porcentual / Decimal(str(entregadas)) if entregadas > 0 else Decimal('0')
        )
        criticidad = _criticidad_por_entregables(promedio_entregables, no_entregadas, total_evaluaciones)

        return Response({
            'estudiante': {
                'persona_id': estudiante.persona_id,
                'nombre': _nombre_estudiante(estudiante),
                'codigo_estudiante': estudiante.codigo_estudiante,
            },
            'criticidad': criticidad,
            'resumen': {
                'total_evaluaciones': total_evaluaciones,
                'entregadas': entregadas,
                'no_entregadas': no_entregadas,
                'bajas': bajas,
                'promedio_entregables': round(float(promedio_entregables), 2),
                'promedio_ponderado': round(float(suma_ponderada), 2),
            },
            'entregables': entregables,
        })

    def create(self, request, *args, **kwargs):
        docente_grupo_id = request.data.get('docente_grupo_id')
        grupo_id = request.data.get('grupo_id')
        
        docente_ids = _get_docente_ids_for_user(request.user)

        if docente_grupo_id:
            docente_grupo = AcademicoDocenteGrupo.objects.filter(
                id=docente_grupo_id,
                docente_id__in=docente_ids,
                activo=True
            ).first()
        elif grupo_id:
            grupo = _get_grupo_docente_or_none(docente_ids, grupo_id)
            if not grupo:
                return Response(
                    {'detail': 'Grupo no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
            docente_grupo = _resolve_or_create_docente_grupo(docente_ids, grupo)
        else:
            return Response(
                {'detail': 'docente_grupo_id o grupo_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not docente_grupo:
            return Response(
                {'detail': 'No tienes permisos para crear evaluaciones en este grupo'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        fecha_evaluacion = serializer.validated_data.get('fecha_evaluacion')
        fecha_entrega = serializer.validated_data.get('fecha_entrega')
        valor_porcentual = serializer.validated_data.get('valor_porcentual')
        nota_maxima = serializer.validated_data.get('nota_maxima')

        if fecha_entrega and fecha_evaluacion and fecha_entrega < fecha_evaluacion:
            return Response(
                {'detail': 'La fecha de entrega no puede ser anterior a la fecha de evaluación.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        nota_maxima_error = _validate_nota_maxima_escala_100(nota_maxima)
        if nota_maxima_error:
            return Response({'detail': nota_maxima_error}, status=status.HTTP_400_BAD_REQUEST)

        porcentaje_error = _validate_porcentaje_disponible(
            docente_grupo=docente_grupo,
            fecha_evaluacion=fecha_evaluacion,
            valor_porcentual=valor_porcentual,
        )
        if porcentaje_error:
            return Response({'detail': porcentaje_error}, status=status.HTTP_400_BAD_REQUEST)

        serializer.save(
            docente_grupo=docente_grupo,
            fecha_creacion=timezone.now(),
            fecha_modificacion=timezone.now(),
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        evaluacion = self.get_object()

        if 'docente_grupo' in request.data or 'docente_grupo_id' in request.data or 'grupo_id' in request.data:
            return Response(
                {'detail': 'No se permite cambiar el grupo o docente de una evaluación existente.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(evaluacion, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        fecha_evaluacion = serializer.validated_data.get('fecha_evaluacion', evaluacion.fecha_evaluacion)
        fecha_entrega = serializer.validated_data.get('fecha_entrega', evaluacion.fecha_entrega)
        valor_porcentual = serializer.validated_data.get('valor_porcentual', evaluacion.valor_porcentual)
        nota_maxima = serializer.validated_data.get('nota_maxima', evaluacion.nota_maxima)

        if fecha_entrega and fecha_evaluacion and fecha_entrega < fecha_evaluacion:
            return Response(
                {'detail': 'La fecha de entrega no puede ser anterior a la fecha de evaluación.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        nota_maxima_error = _validate_nota_maxima_escala_100(nota_maxima)
        if nota_maxima_error:
            return Response({'detail': nota_maxima_error}, status=status.HTTP_400_BAD_REQUEST)

        porcentaje_error = _validate_porcentaje_disponible(
            docente_grupo=evaluacion.docente_grupo,
            fecha_evaluacion=fecha_evaluacion,
            valor_porcentual=valor_porcentual,
            exclude_evaluacion_id=evaluacion.id,
        )
        if porcentaje_error:
            return Response({'detail': porcentaje_error}, status=status.HTTP_400_BAD_REQUEST)

        serializer.save(fecha_modificacion=timezone.now())
        output = EvaluacionesEvaluacionSerializer(evaluacion, context=self.get_serializer_context())
        return Response(output.data)

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.partial_update(request, *args, **kwargs)


class EvaluacionesCalificacionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EvaluacionesCalificacionSerializer

    def get_queryset(self):
        docente_ids = _get_docente_ids_for_user(self.request.user)
        if not docente_ids:
            return EvaluacionesCalificacion.objects.none()

        return EvaluacionesCalificacion.objects.filter(
            evaluacion__docente_grupo__docente_id__in=docente_ids,
        ).select_related('evaluacion', 'estudiante')

    @action(detail=False, methods=['get'], url_path='evaluacion/(?P<evaluacion_id>[0-9]+)')
    def por_evaluacion(self, request, evaluacion_id=None):
        docente_ids = _get_docente_ids_for_user(request.user)
        
        evaluacion = EvaluacionesEvaluacion.objects.filter(
            id=evaluacion_id,
            docente_grupo__docente_id__in=docente_ids,
        ).first()

        if not evaluacion:
            return Response({'detail': 'Evaluación no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        calificaciones = EvaluacionesCalificacion.objects.filter(
            evaluacion_id=evaluacion_id
        ).select_related('estudiante')

        serializer = self.get_serializer(calificaciones, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        evaluacion_id = request.data.get('evaluacion_id')
        estudiante_id = request.data.get('estudiante_id')
        nota = request.data.get('nota')

        docente_ids = _get_docente_ids_for_user(request.user)

        evaluacion = EvaluacionesEvaluacion.objects.filter(
            id=evaluacion_id,
            docente_grupo__docente_id__in=docente_ids,
        ).first()

        if not evaluacion:
            return Response(
                {'detail': 'Evaluación no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        nota_decimal = _to_decimal(nota)
        if nota_decimal is None:
            return Response({'detail': 'La nota debe ser numérica.'}, status=status.HTTP_400_BAD_REQUEST)
        if nota_decimal < Decimal('0') or nota_decimal > evaluacion.nota_maxima:
            return Response(
                {'detail': f'La nota debe estar entre 0 y {evaluacion.nota_maxima}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            estudiante = PersonasEstudiante.objects.get(persona_id=estudiante_id)
        except PersonasEstudiante.DoesNotExist:
            return Response(
                {'detail': 'Estudiante no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        matricula_activa = AcademicoMatricula.objects.filter(
            estudiante=estudiante,
            grupo_id=evaluacion.docente_grupo.grupo_id,
            estado__iexact='activo',
        ).exists()
        if not matricula_activa:
            return Response(
                {'detail': 'El estudiante no pertenece activamente al grupo de esta evaluación.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        calificacion, created = EvaluacionesCalificacion.objects.get_or_create(
            evaluacion=evaluacion,
            estudiante=estudiante,
            defaults={
                'nota': nota_decimal,
                'estado': 'registrado',
                'ausente': False,
                'justificado': False,
                'observaciones': '',
                'fecha_registro': timezone.now(),
                'registrada_por_id': request.user.id,
            }
        )

        if not created:
            calificacion.nota = nota_decimal
            calificacion.fecha_registro = timezone.now()
            calificacion.registrada_por_id = request.user.id
            calificacion.save()

        serializer = self.get_serializer(calificacion)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def partial_update(self, request, *args, **kwargs):
        calificacion = self.get_object()
        nota = request.data.get('nota', None)

        if nota is None:
            return Response({'detail': 'La nota es requerida.'}, status=status.HTTP_400_BAD_REQUEST)

        nota_decimal = _to_decimal(nota)
        if nota_decimal is None:
            return Response({'detail': 'La nota debe ser numérica.'}, status=status.HTTP_400_BAD_REQUEST)

        nota_maxima = calificacion.evaluacion.nota_maxima
        if nota_decimal < Decimal('0') or nota_decimal > nota_maxima:
            return Response(
                {'detail': f'La nota debe estar entre 0 y {nota_maxima}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        calificacion.nota = nota_decimal
        calificacion.fecha_registro = timezone.now()
        calificacion.registrada_por_id = request.user.id
        calificacion.save(update_fields=['nota', 'fecha_registro', 'registrada_por'])

        serializer = self.get_serializer(calificacion)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.partial_update(request, *args, **kwargs)
