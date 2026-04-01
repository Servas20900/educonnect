import json
from datetime import date

from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser

from .models import AsistenciaRegistro, AsistenciaDetalle
from apps.databaseModels.models import AcademicoMatricula, PersonasEstudiante, AcademicoGrupo


class GruposDocenteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        grupos = AcademicoGrupo.objects.filter(docente_guia_id=request.user.id)

        data = []
        for g in grupos:
            nombre = getattr(g, "nombre", None) or getattr(g, "descripcion", None) or f"Grupo {g.id}"
            data.append({
                "id": g.id,
                "nombre": nombre
            })

        return Response(data, status=status.HTTP_200_OK)


class AsistenciaDiariaView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request, grupo_id):
        fecha = request.query_params.get("fecha") or str(date.today())

        try:
            grupo = AcademicoGrupo.objects.get(id=grupo_id, docente_guia_id=request.user.id)
        except AcademicoGrupo.DoesNotExist:
            return Response({"detail": "Grupo no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        matriculas = AcademicoMatricula.objects.select_related(
            "estudiante__persona"
        ).filter(
            grupo=grupo,
            estado="activo"
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
            persona = getattr(estudiante, "persona", None)
            detalle = detalles_map.get(estudiante.id)

            data.append({
                "estudiante_id": estudiante.id,
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

        if not asistencias_raw:
            return Response({"detail": "asistencias es requerido."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            grupo = AcademicoGrupo.objects.get(id=grupo_id, docente_guia_id=request.user.id)
        except AcademicoGrupo.DoesNotExist:
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
                estudiante = PersonasEstudiante.objects.get(id=estudiante_id)
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

        try:
            grupo = AcademicoGrupo.objects.get(id=grupo_id, docente_guia_id=request.user.id)
        except AcademicoGrupo.DoesNotExist:
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
        try:
            grupo = AcademicoGrupo.objects.get(id=grupo_id, docente_guia_id=request.user.id)
        except AcademicoGrupo.DoesNotExist:
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
                    "estudiante_id": d.estudiante.id,
                    "nombre": f"{persona.nombre} {persona.primer_apellido} {persona.segundo_apellido or ''}".strip() if persona else "N/A",
                    "estado": d.estado,
                    "justificada": d.justificada,
                    "justificante": d.justificante.url if d.justificante else None,
                    "observacion": d.observacion or "",
                })

        return Response(data, status=status.HTTP_200_OK)