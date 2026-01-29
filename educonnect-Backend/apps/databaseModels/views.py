from django.shortcuts import render
from .serializers import *
from rest_framework import viewsets, permissions,status,response
from .models import * 
from rest_framework.views import APIView

# Create your views here.

class ViewComunicacionesCircular(viewsets.ModelViewSet):
    queryset = ComunicacionesCircular.objects.all().order_by('id')
    permission_classes = [permissions.IsAuthenticated]
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WriteSerializerComunicacionesCircular
        return ReadSerializerComunicacionesCircular
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.estado = 'Inactivo' 
        instance.save()
        return response.Response(
            {"message": f"Circular '{instance.titulo}' marcada como inactiva."}, 
            status=status.HTTP_200_OK
        )

class RegistroUsuarioView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegistroSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return response.Response(
                {"mensaje": "Usuario registrado exitosamente"}, 
                status=status.HTTP_201_CREATED
            )
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)