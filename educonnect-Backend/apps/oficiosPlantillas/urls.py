from rest_framework import routers
from .views import ViewOficiosPlantilla

router = routers.DefaultRouter()
router.register(r'OficiosPlantilla', ViewOficiosPlantilla)

urlpatterns = router.urls