from django.shortcuts import render
from .serializers import *
from rest_framework import viewsets, permissions
from .models import * 

# Create your views here.

class ViewComunicacionesCircular(viewsets.ModelViewSet):
    queryset = ComunicacionesCircular.objects.all().order_by('id')
    permission_classes = [permissions.IsAuthenticated]
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WriteSerializerComunicacionesCircular
        return ReadSerializerComunicacionesCircular