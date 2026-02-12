from rest_framework import viewsets
from apps.databaseModels.models import AcademicoAsignatura
from .serializers import AcademicoAsignaturaSerializer

class AcademicoAsignaturaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AcademicoAsignatura.objects.filter(activo=True).order_by('nombre')
    serializer_class = AcademicoAsignaturaSerializer