from django.urls import path, include
from rest_framework import routers
from .views import UsuarioViewSet, RolViewSet, PermisoViewSet, ModuloViewSet

router = routers.DefaultRouter()
router.register(r'usuarios', UsuarioViewSet, basename='usuarios')
router.register(r'roles', RolViewSet, basename='roles')
router.register(r'permisos', PermisoViewSet, basename='permisos')
router.register(r'modulos', ModuloViewSet, basename='modulos')

urlpatterns = [
    path('', include(router.urls)),
]
