from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from .models import PreferenciaNotificacion
from apps.databaseModels.models import ComunicacionesNotificacion


class PreferenciaProfesorHogarView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        pref, _ = PreferenciaNotificacion.objects.get_or_create(usuario=request.user)
        return Response({
            "recibir_profesor_hogar": pref.recibir_profesor_hogar
        }, status=status.HTTP_200_OK)

    def put(self, request):
        pref, _ = PreferenciaNotificacion.objects.get_or_create(usuario=request.user)
        pref.recibir_profesor_hogar = bool(request.data.get("recibir_profesor_hogar", True))
        pref.save()

        return Response({
            "message": "Preferencias actualizadas correctamente.",
            "recibir_profesor_hogar": pref.recibir_profesor_hogar
        }, status=status.HTTP_200_OK)


class HistorialNotificacionesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        historial = ComunicacionesNotificacion.objects.filter(
            usuario=request.user,
            tipo_notificacion="profesor_hogar"
        ).order_by("-fecha_creacion")

        data = []
        for n in historial:
            data.append({
                "id": n.id,
                "titulo": n.titulo,
                "mensaje": n.mensaje,
                "enlace": n.enlace,
                "leida": n.leida,
                "prioridad": n.prioridad,
                "fecha_creacion": n.fecha_creacion,
            })

        return Response(data, status=status.HTTP_200_OK)