from rest_framework import viewsets
from apps.databaseModels.models import AcademicoGrupo, AcademicoGrado
from .serializers import AcademicoGrupoSerializer, AcademicoGradoSerializer


class AcademicoGradoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AcademicoGrado.objects.filter(activo=True).order_by('nivel', 'numero_grado', 'nombre')
    serializer_class = AcademicoGradoSerializer

class AcademicoGrupoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AcademicoGrupo.objects.filter(estado='Activo').select_related('grado', 'seccion')
    serializer_class = AcademicoGrupoSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        grado_id = self.request.query_params.get('grado_id')
        if grado_id:
            queryset = queryset.filter(grado_id=grado_id)

        return queryset