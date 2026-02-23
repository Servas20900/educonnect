from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from apps.carpetas.services import DocumentService

from rest_framework import viewsets, status
from rest_framework.response import Response
from apps.databaseModels.models import ComitesReunion, ComitesActa
from .serializers import ReunionSerializer, ActaSerializer
from .services import ReunionNotificationService

class ReunionViewSet(viewsets.ModelViewSet):
    queryset = ComitesReunion.objects.all().order_by('-fecha')
    serializer_class = ReunionSerializer

    def perform_create(self, serializer):
        reunion = serializer.save(convocada_por=self.request.user)
        ReunionNotificationService.notificar_participantes(reunion)

    def perform_update(self, serializer):
        reunion = serializer.save()
        ReunionNotificationService.notificar_participantes(reunion, es_actualizacion=True)

class ActaViewSet(viewsets.ModelViewSet):
    queryset = ComitesActa.objects.all()
    serializer_class = ActaSerializer

    def perform_create(self, serializer):
        serializer.save(elaborada_por=self.request.user)

class CompartirActaView(APIView):
    def post(self, request, acta_id):
        acta = get_object_or_404(ComitesActa, id=acta_id)
        archivo = request.FILES.get('file')
        if archivo:
            try:
                doc = DocumentService.procesar_subida(
                    archivo=archivo,
                    objeto_destino=acta, 
                    usuario=request.user,
                    descripcion=f"Acta oficial número {acta.numero_acta}"
                )
                
                return Response({
                    "message": "Acta compartida exitosamente",
                    "documento_id": doc.id,
                    "url": doc.ruta_archivo
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({
                    "error": f"Error al procesar el archivo: {str(e)}"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            "error": "No se proporcionó ningún archivo binario en la llave 'file'."
        }, status=status.HTTP_400_BAD_REQUEST)