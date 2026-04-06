import json
from datetime import date
from django.db.models import Q

from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser

from .models import AsistenciaRegistro, AsistenciaDetalle
from apps.databaseModels.models import AcademicoMatricula, PersonasEstudiante, AcademicoGrupo, PersonasDocente


def _parse_date_or_none(raw_date):
    if not raw_date:
        return None
    try:
        return date.fromisoformat(str(raw_date))
    except ValueError:
        return None


def _is_invalid_attendance_date(target_date):
    if not target_date:
        return True
    if target_date < date.today():
        return True
    if target_date.weekday() >= 5:
        return True
    return False


def _docente_candidate_ids(user):
    candidate_ids = set()
    persona_id = getattr(user, "persona_id", None)
    if persona_id:
        candidate_ids.add(persona_id)
    if getattr(user, "id", None):
        candidate_ids.add(user.id)
    return list(candidate_ids)


def _get_docente_ids_for_user(user):
    candidate_ids = _docente_candidate_ids(user)
    if not candidate_ids:
        return []
    docentes_ids = list(
        PersonasDocente.objects.filter(persona_id__in=candidate_ids).values_list("persona_id", flat=True)
    )
    return docentes_ids or candidate_ids


def _get_docente_for_user(user):
    persona_id = getattr(user, "persona_id", None)
    if not persona_id:
        return None
    return PersonasDocente.objects.filter(persona_id=persona_id).first()


def _get_grupo_docente_or_none(docente_ids, grupo_id):
    if not docente_ids:
        return None

    return (
        AcademicoGrupo.objects.filter(
            Q(docente_guia_id__in=docente_ids)
            | Q(academicodocentegrupo__docente_id__in=docente_ids, academicodocentegrupo__activo=True),
            id=grupo_id,
            estado__iexact="activo",
        )
        .distinct()
        .first()
    )


class GruposDocenteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        docente_ids = _get_docente_ids_for_user(request.user)
        if not docente_ids:
            return Response([], status=status.HTTP_200_OK)

        grupos = (
            AcademicoGrupo.objects.filter(
                Q(docente_guia_id__in=docente_ids)
                | Q(academicodocentegrupo__docente_id__in=docente_ids, academicodocentegrupo__activo=True),
                estado__iexact="activo",
            )
            .order_by("grado__numero_grado", "seccion__nombre", "nombre")
            .distinct()
        )

        data = []
        for g in grupos:
            data.append({
                "id": g.id,
                "nombre": g.nombre,
                "codigo_grupo": g.codigo_grupo,
                "label": f"{g.nombre} ({g.codigo_grupo})",
            })

        return Response(data, status=status.HTTP_200_OK)


class AsistenciaDiariaView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request, grupo_id):
        fecha = request.query_params.get("fecha") or str(date.today())
        fecha_obj = _parse_date_or_none(fecha)
        if _is_invalid_attendance_date(fecha_obj):
            return Response(
                {"detail": "Solo se permite registrar asistencia para hoy o fechas futuras en días hábiles."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        docente_ids = _get_docente_ids_for_user(request.user)
        grupo = _get_grupo_docente_or_none(docente_ids, grupo_id)
        if not grupo:
            return Response({"detail": "Grupo no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        matriculas = AcademicoMatricula.objects.select_related(
            "estudiante__persona"
        ).filter(
            grupo=grupo,
            estado__iexact="activo"
        )

        registro = AsistenciaRegistro.objects.filter(
            grupo=grupo,
            fecha=fecha
        ).first()

        detalles_map = {}
        cerrado = False

        if registro:
            detalles = AsistenciaDetalle.objects.filter(registro=registro).select_related("estudiante__persona")
            detalles_map = {d.estudiante_id: d for d in detalles}
            cerrado = registro.cerrado

        data = []
        for m in matriculas:
            estudiante = m.estudiante
            if not estudiante:
                continue
            persona = getattr(estudiante, "persona", None)
            detalle = detalles_map.get(estudiante.pk)

            data.append({
                "estudiante_id": estudiante.pk,
                "persona_id": persona.id if persona else None,
                "nombre": f"{persona.nombre} {persona.primer_apellido} {persona.segundo_apellido or ''}".strip() if persona else "N/A",
                "codigo_estudiante": getattr(estudiante, "codigo_estudiante", "N/A"),
                "estado": detalle.estado if detalle else "presente",
                "justificada": detalle.justificada if detalle else False,
                "justificante": detalle.justificante.url if detalle and detalle.justificante else None,
                "observacion": detalle.observacion if detalle else "",
            })

        presentes = sum(1 for e in data if e["estado"] == "presente")
        ausentes = sum(1 for e in data if e["estado"] == "ausente")
        tardias = sum(1 for e in data if e["estado"] == "tardia")
        justificadas = sum(1 for e in data if e["justificada"])

        return Response({
            "grupo_id": grupo_id,
            "fecha": fecha,
            "cerrado": cerrado,
            "estudiantes": data,
            "resumen": {
                "presentes": presentes,
                "ausentes": ausentes,
                "tardias": tardias,
                "justificadas": justificadas,
                "total": len(data),
            }
        }, status=status.HTTP_200_OK)

    def post(self, request, grupo_id):
        fecha = request.data.get("fecha")
        asistencias_raw = request.data.get("asistencias")

        if not fecha:
            return Response({"detail": "fecha es requerida."}, status=status.HTTP_400_BAD_REQUEST)

        fecha_obj = _parse_date_or_none(fecha)
        if _is_invalid_attendance_date(fecha_obj):
            return Response(
                {"detail": "Solo se permite registrar asistencia para hoy o fechas futuras en días hábiles."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not asistencias_raw:
            return Response({"detail": "asistencias es requerido."}, status=status.HTTP_400_BAD_REQUEST)

        docente_ids = _get_docente_ids_for_user(request.user)
        grupo = _get_grupo_docente_or_none(docente_ids, grupo_id)
        if not grupo:
            return Response({"detail": "Grupo no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        try:
            asistencias = json.loads(asistencias_raw)
        except Exception:
            return Response({"detail": "Formato inválido en asistencias."}, status=status.HTTP_400_BAD_REQUEST)

        registro, created = AsistenciaRegistro.objects.get_or_create(
            grupo=grupo,
            fecha=fecha,
            defaults={"docente": request.user}
        )

        if registro.cerrado:
            return Response(
                {"detail": "La asistencia de este día ya fue cerrada y no puede editarse."},
                status=status.HTTP_400_BAD_REQUEST
            )

        for item in asistencias:
            estudiante_id = item.get("estudiante_id")
            estado = item.get("estado", "presente")
            justificada = item.get("justificada", False)
            observacion = item.get("observacion", "")

            try:
                estudiante = PersonasEstudiante.objects.get(pk=estudiante_id)
            except PersonasEstudiante.DoesNotExist:
                continue

            detalle, _ = AsistenciaDetalle.objects.get_or_create(
                registro=registro,
                estudiante=estudiante,
                defaults={
                    "estado": estado,
                    "justificada": justificada,
                    "observacion": observacion
                }
            )

            detalle.estado = estado
            detalle.justificada = bool(justificada)
            detalle.observacion = observacion

            archivo = request.FILES.get(f"justificante_{estudiante_id}")
            if archivo:
                detalle.justificante = archivo

            detalle.save()

        return Response(
            {"message": "Asistencia guardada correctamente."},
            status=status.HTTP_200_OK
        )


class CerrarAsistenciaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, grupo_id):
        fecha = request.data.get("fecha")

        if not fecha:
            return Response({"detail": "fecha es requerida."}, status=status.HTTP_400_BAD_REQUEST)

        fecha_obj = _parse_date_or_none(fecha)
        if _is_invalid_attendance_date(fecha_obj):
            return Response(
                {"detail": "Solo se permite cerrar asistencia para hoy o fechas futuras en días hábiles."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        docente_ids = _get_docente_ids_for_user(request.user)
        grupo = _get_grupo_docente_or_none(docente_ids, grupo_id)
        if not grupo:
            return Response({"detail": "Grupo no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        try:
            registro = AsistenciaRegistro.objects.get(grupo=grupo, fecha=fecha)
        except AsistenciaRegistro.DoesNotExist:
            return Response({"detail": "No existe asistencia para cerrar en esa fecha."}, status=status.HTTP_404_NOT_FOUND)

        registro.cerrado = True
        registro.save()

        return Response({"message": "Registro diario cerrado correctamente."}, status=status.HTTP_200_OK)


class HistorialAsistenciaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, grupo_id):
        docente_ids = _get_docente_ids_for_user(request.user)
        grupo = _get_grupo_docente_or_none(docente_ids, grupo_id)
        if not grupo:
            return Response({"detail": "Grupo no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        registros = AsistenciaRegistro.objects.filter(
            grupo=grupo
        ).prefetch_related("detalles__estudiante__persona").order_by("-fecha")

        data = []
        for registro in registros:
            for d in registro.detalles.all():
                persona = getattr(d.estudiante, "persona", None)
                data.append({
                    "registro_id": registro.id,
                    "fecha": registro.fecha,
                    "estudiante_id": d.estudiante_id,
                    "nombre": f"{persona.nombre} {persona.primer_apellido} {persona.segundo_apellido or ''}".strip() if persona else "N/A",
                    "estado": d.estado,
                    "justificada": d.justificada,
                    "justificante": d.justificante.url if d.justificante else None,
                    "observacion": d.observacion or "",
                })

        return Response(data, status=status.HTTP_200_OK)