from rest_framework import viewsets, permissions,response,status
from apps.databaseModels.models import HorariosHorario
from .serializers import ReadSerializerHorariosHorario, WriteSerializerHorariosHorario
from django.db.models import Case, Value, When, IntegerField

class ViewHorariosHorario(viewsets.ModelViewSet):
    queryset = HorariosHorario.objects.annotate(
    prioridad_estado=Case(
        When(estado="Publicado", then=Value(1)),
        When(estado="Borrador", then=Value(2)),
        When(estado="Inactivo", then=Value(3)),
        default=Value(4),
        output_field=IntegerField(),
    )
).order_by('prioridad_estado', '-fecha_creacion')
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