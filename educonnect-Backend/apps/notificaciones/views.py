from rest_framework.views import APIView
from rest_framework import permissions

from .models import PreferenciaNotificacion
from apps.databaseModels.models import ComunicacionesNotificacion
from core.permissions import IsAuthenticated
from core.responses import success_response


class PreferenciaProfesorHogarView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pref, _ = PreferenciaNotificacion.objects.get_or_create(usuario=request.user)
        return success_response({"recibir_profesor_hogar": pref.recibir_profesor_hogar})

    def put(self, request):
        pref, _ = PreferenciaNotificacion.objects.get_or_create(usuario=request.user)
        pref.recibir_profesor_hogar = bool(request.data.get("recibir_profesor_hogar", True))
        pref.save()
        return success_response(
            {"recibir_profesor_hogar": pref.recibir_profesor_hogar},
            "Preferencias actualizadas correctamente.",
        )


class HistorialNotificacionesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        historial = ComunicacionesNotificacion.objects.filter(
            usuario=request.user,
            tipo_notificacion="profesor_hogar",
        ).order_by("-fecha_creacion").values(
            "id", "titulo", "mensaje", "enlace", "leida", "prioridad", "fecha_creacion"
        )
        return success_response(list(historial))