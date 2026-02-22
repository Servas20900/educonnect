from django.urls import path, include
from rest_framework import routers
from .views import  *

router = routers.DefaultRouter()

router.register(r'ComunicacionesCircular', ViewComunicacionesCircular)
router.register(r'ComunicacionesComunicado', ViewComunicacionesComunicado, basename='comunicaciones-comunicado')


urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegistroUsuarioView.as_view(), name='auth_register'),
]