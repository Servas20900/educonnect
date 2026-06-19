from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from apps.carpetas.services import DocumentService

from rest_framework import viewsets, status
from rest_framework.response import Response
from apps.databaseModels.models import ComitesReunion, ComitesActa
from .serializers import ReunionSerializer, ActaSerializer
from .services import ReunionNotificationService
from core.permissions import IsAuthenticated, IsComiteUser, IsAdmin
from core.responses import success_response, created_response, error_response


class ReunionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsComiteUser | IsAdmin]
    queryset = ComitesReunion.objects.all().order_by('-fecha')
    serializer_class = ReunionSerializer

    def perform_create(self, serializer):
        reunion = serializer.save(convocada_por=self.request.user)
        ReunionNotificationService.notificar_participantes(reunion)

    def perform_update(self, serializer):
        reunion = serializer.save()
        ReunionNotificationService.notificar_participantes(reunion, es_actualizacion=True)


class ActaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsComiteUser | IsAdmin]
    queryset = ComitesActa.objects.all()
    serializer_class = ActaSerializer

    def perform_create(self, serializer):
        serializer.save(elaborada_por=self.request.user)


class CompartirActaView(APIView):
    permission_classes = [IsComiteUser | IsAdmin]

    def post(self, request, acta_id):
        acta = get_object_or_404(ComitesActa, id=acta_id)
        archivo = request.FILES.get('file')
        if not archivo:
            return error_response("No se proporcionó ningún archivo binario en la llave 'file'.")
        try:
            doc = DocumentService.procesar_subida(
                archivo=archivo,
                objeto_destino=acta,
                usuario=request.user,
                descripcion=f"Acta oficial número {acta.numero_acta}",
            )
            return created_response(
                {"documento_id": doc.id, "url": doc.ruta_archivo},
                "Acta compartida exitosamente.",
            )
        except Exception as e:
            return error_response(
                f"Error al procesar el archivo: {str(e)}",
                code="file_error",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )