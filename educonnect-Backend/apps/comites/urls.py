from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ComitesComiteViewSet,
    ComitesMiembroViewSet,
    PersonasDisponiblesViewSet,
    ComitesActaViewSet,
    ComitesInformeOrganoViewSet,
)

router = DefaultRouter()
router.register(r'comites', ComitesComiteViewSet, basename='comites')
router.register(r'miembros', ComitesMiembroViewSet, basename='comites-miembros')
router.register(r'personas-disponibles', PersonasDisponiblesViewSet, basename='personas-disponibles')
router.register(r'actas', ComitesActaViewSet, basename='comites-actas')
router.register(r'reportes', ComitesInformeOrganoViewSet, basename='comites-reportes')

urlpatterns = [
    path('', include(router.urls)),
]
