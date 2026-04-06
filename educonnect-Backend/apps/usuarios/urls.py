from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ViewDocentes, ViewEstudiantes, ViewGrados, ViewGrupos

router = DefaultRouter()
router.register(r'docentes', ViewDocentes, basename='usuarios-docentes')
router.register(r'estudiantes', ViewEstudiantes, basename='usuarios-estudiantes')
router.register(r'grados', ViewGrados, basename='usuarios-grados')
router.register(r'grupos', ViewGrupos, basename='usuarios-grupos')

urlpatterns = [
    path('', include(router.urls)),
]
