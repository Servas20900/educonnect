from rest_framework import viewsets, permissions
from databaseModels.models import HorariosHorario
from .serializers import ReadSerializerHorariosHorario, WriteSerializerHorariosHorario

class ViewHorariosHorario(viewsets.ModelViewSet):
    queryset = HorariosHorario.objects.all().order_by('id')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WriteSerializerHorariosHorario
        return ReadSerializerHorariosHorario
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.estado = 'Inactivo'
        instance.save()
        
        return response.Response(
            {"message": f"El horario '{instance.nombre}' ha sido marcado como inactivo."},
            status=status.HTTP_200_OK
        )