from django.urls import include
from rest_framework.routers import DefaultRouter
from .views import ViewOficiosPlantilla

router = DefaultRouter()
router.register(r'oficios-plantillas', ViewOficiosPlantilla, basename='oficios-plantillas')

urlpatterns = router.urls
