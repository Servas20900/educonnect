from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ViewComunicacionesComunicado,
    ViewComunicacionesCircular,
    ViewEstudiantes,
    RegistroUsuarioView,
    GrupoEstudiantesView,
    GrupoEstudiantesImportView,
    GrupoEstudianteRemoveView,
    GruposDocenteView,
    RegistrarEstudianteView,
)

router = DefaultRouter()
router.register(r'circulares',  ViewComunicacionesCircular,   basename='circulares')
router.register(r'comunicados', ViewComunicacionesComunicado, basename='comunicados')
router.register(r'estudiantes', ViewEstudiantes,              basename='db-estudiantes')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/',                              RegistroUsuarioView.as_view(),        name='auth_register'),
    path('grupos/<int:grupo_id>/estudiantes/',          GrupoEstudiantesView.as_view(),       name='grupo_estudiantes'),
    path('grupos/<int:grupo_id>/estudiantes/importar/', GrupoEstudiantesImportView.as_view(), name='grupo_estudiantes_importar'),
    path('grupos/<int:grupo_id>/estudiantes/registrar/', RegistrarEstudianteView.as_view(), name='grupo_estudiante_registrar'),
    path('matriculas/<int:matricula_id>/',              GrupoEstudianteRemoveView.as_view(),  name='grupo_estudiante_remove'),
    path('grupos/docente/',                             GruposDocenteView.as_view(),          name='grupos_docente_db'),
]