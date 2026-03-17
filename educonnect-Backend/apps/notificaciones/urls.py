from django.urls import path
from .views import PreferenciaProfesorHogarView, HistorialNotificacionesView

urlpatterns = [
    path("preferencias/profesor-hogar/", PreferenciaProfesorHogarView.as_view(), name="preferencias_profesor_hogar"),
    path("historial/profesor-hogar/", HistorialNotificacionesView.as_view(), name="historial_profesor_hogar"),
]