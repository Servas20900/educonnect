from rest_framework import routers
from .views import ViewExportaciones

router = routers.DefaultRouter()
router.register(r'Exportaciones', ViewExportaciones, basename="exportaciones")

urlpatterns = router.urls