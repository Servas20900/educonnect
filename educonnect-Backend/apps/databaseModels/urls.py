from django.urls import path, include
from rest_framework import routers
from .views import  *

router = routers.DefaultRouter()

router.register(r'ComunicacionesCircular', ViewComunicacionesCircular)
router.register(r'ComunicacionesComunicado', ViewComunicacionesComunicado, basename='comunicaciones-comunicado')
router.register(r'estudiantes', ViewEstudiantes, basename='estudiantes')


urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegistroUsuarioView.as_view(), name='auth_register'),
   
    path('grupos/<int:grupo_id>/estudiantes/', GrupoEstudiantesView.as_view(), name='grupo_estudiantes'),
    path('grupos/<int:grupo_id>/estudiantes/importar/', GrupoEstudiantesImportView.as_view(), name='grupo_estudiantes_importar'),
    path('matriculas/<int:matricula_id>/', GrupoEstudianteRemoveView.as_view(), name='grupo_estudiante_remove'),
    path("grupos/docente/", GruposDocenteView.as_view(), name="grupos_docente"),

]