from rest_framework import viewsets
from apps.databaseModels.models import AcademicoAsignatura
from .serializers import AcademicoAsignaturaSerializer
from core.permissions import IsAuthenticated


class AcademicoAsignaturaViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = AcademicoAsignatura.objects.filter(activo=True).order_by('nombre')
    serializer_class = AcademicoAsignaturaSerializer