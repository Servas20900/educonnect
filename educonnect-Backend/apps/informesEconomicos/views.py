from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import PatronatoInforme
from .serializers import InformeEconomicoWriteSerializer, InformeEconomicoReadSerializer

class PatronatoInformeViewSet(viewsets.ModelViewSet):
    queryset = PatronatoInforme.objects.filter(estado='Activo').order_by('-fecha_creacion')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return InformeEconomicoWriteSerializer
        return InformeEconomicoReadSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        informe = serializer.save()
        
        read_serializer = InformeEconomicoReadSerializer(informe)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)