from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.databaseModels.models import (
    AcademicoDocenteGrupo,
    AcademicoGrado,
    AcademicoGrupo,
    AcademicoMatricula,
)
from .serializers import AcademicoGradoSerializer, AcademicoGrupoSerializer


class AcademicoGradoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AcademicoGradoSerializer
    permission_classes = [IsAuthenticated]
    queryset = AcademicoGrado.objects.filter(activo=True).order_by(
        'nivel', 'numero_grado', 'nombre'
    )


class AcademicoGrupoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AcademicoGrupoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = AcademicoGrupo.objects.filter(estado='Activo').select_related(
            'grado', 'seccion'
        )
        grado_id = self.request.query_params.get('grado_id')
        if grado_id:
            qs = qs.filter(grado_id=grado_id)
        return qs

    @action(detail=False, methods=['get'], url_path='por-docente')
    def por_docente(self, request):
        """
        Devuelve los grupos activos asignados al docente autenticado.
        Usado por el home del modulo docente para mostrar sus grupos.
        GET /grupos/por-docente/
        """
        docente_id = (
            request.query_params.get('docente_id')
            or getattr(getattr(request.user, 'persona', None), 'id', None)
        )
        if not docente_id:
            return Response(
                {'error': 'No se pudo determinar el docente.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        grupo_ids = AcademicoDocenteGrupo.objects.filter(
            docente__persona_id=docente_id
        ).values_list('grupo_id', flat=True)

        grupos = AcademicoGrupo.objects.filter(
            id__in=grupo_ids, estado='Activo'
        ).select_related('grado', 'seccion')

        serializer = self.get_serializer(grupos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='estudiantes')
    def estudiantes(self, request, pk=None):
        """
        Devuelve los estudiantes matriculados en un grupo.
        GET /grupos/{id}/estudiantes/
        """
        grupo = self.get_object()

        matriculas = AcademicoMatricula.objects.filter(
            grupo=grupo
        ).select_related(
            'estudiante__persona'
        )

        data = []
        for m in matriculas:
            persona = getattr(m.estudiante, 'persona', None)
            if not persona:
                continue
            data.append({
                'estudiante_id': m.estudiante.id,
                'persona_id': persona.id,
                'nombre': persona.nombre,
                'primer_apellido': persona.primer_apellido,
                'segundo_apellido': persona.segundo_apellido or '',
                'nombre_completo': f"{persona.nombre} {persona.primer_apellido} {persona.segundo_apellido or ''}".strip(),
                'codigo_estudiante': m.estudiante.codigo_estudiante,
                'estado_matricula': m.estado if hasattr(m, 'estado') else None,
            })

        return Response(data)