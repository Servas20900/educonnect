from django.urls import path
from .views import GruposDocenteView, AsistenciaDiariaView, HistorialAsistenciaView, CerrarAsistenciaView

urlpatterns = [
    path("grupos-docente/", GruposDocenteView.as_view(), name="grupos_docente"),
    path("grupo/<int:grupo_id>/diaria/", AsistenciaDiariaView.as_view(), name="asistencia_diaria"),
    path("grupo/<int:grupo_id>/cerrar/", CerrarAsistenciaView.as_view(), name="cerrar_asistencia"),
    path("grupo/<int:grupo_id>/historial/", HistorialAsistenciaView.as_view(), name="historial_asistencia"),
]