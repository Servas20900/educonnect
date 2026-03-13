from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.informesEconomicos.views import PatronatoInformeViewSet

router = DefaultRouter()
router.register(r'informes-economicos', PatronatoInformeViewSet, basename='informes-economicos')
urlpatterns = [
    path('', include(router.urls)),
]