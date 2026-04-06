from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q

from apps.databaseModels.models import (
    AcademicoDocenteGrupo,
    AcademicoGrado,
    AcademicoGrupo,
    AcademicoMatricula,
    PersonasDocente,
)
from .serializers import AcademicoGradoSerializer, AcademicoGrupoSerializer


def _docente_candidate_ids(user):
    candidate_ids = set()
    persona_id = getattr(user, 'persona_id', None)
    if persona_id:
        candidate_ids.add(persona_id)
    if getattr(user, 'id', None):
        candidate_ids.add(user.id)
    return list(candidate_ids)


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
        qs = AcademicoGrupo.objects.filter(estado__iexact='activo').select_related(
            'grado', 'seccion'
        )
        grado_id = self.request.query_params.get('grado_id')
        if grado_id:
            qs = qs.filter(grado_id=grado_id)
        return qs

    @action(detail=False, methods=['get'], url_path='por-docente')
    def por_docente(self, request):
        try:
            candidate_ids = _docente_candidate_ids(request.user)
            if not candidate_ids:
                return Response([], status=status.HTTP_200_OK)

            docentes_ids = list(
                PersonasDocente.objects.filter(persona_id__in=candidate_ids).values_list('persona_id', flat=True)
            )
            if not docentes_ids:
                docentes_ids = candidate_ids

            grupos = AcademicoGrupo.objects.filter(
                Q(docente_guia_id__in=docentes_ids)
                | Q(academicodocentegrupo__docente_id__in=docentes_ids, academicodocentegrupo__activo=True),
                estado__iexact='activo',
            ).select_related('grado', 'seccion').annotate(
                total_estudiantes=Count('academicomatricula', filter=Q(academicomatricula__estado='activo'))
            ).order_by('grado__numero_grado', 'seccion__nombre', 'nombre').distinct()

            data = []
            for grupo in grupos:
                data.append(
                    {
                        'id': grupo.id,
                        'nombre': grupo.nombre,
                        'codigo_grupo': grupo.codigo_grupo,
                        'grado_nombre': getattr(grupo.grado, 'nombre', None),
                        'seccion_nombre': getattr(grupo.seccion, 'nombre', None),
                        'label': f"{grupo.nombre} ({grupo.codigo_grupo})",
                        'total_estudiantes': grupo.total_estudiantes,
                    }
                )

            return Response(data, status=status.HTTP_200_OK)
        except Exception:
            return Response([], status=status.HTTP_200_OK)

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