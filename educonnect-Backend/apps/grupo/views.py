from rest_framework import viewsets
from apps.databaseModels.models import AcademicoGrupo
from .serializers import AcademicoGrupoSerializer

class AcademicoGrupoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AcademicoGrupo.objects.filter(estado='Activo').select_related('grado', 'seccion')
    serializer_class = AcademicoGrupoSerializer