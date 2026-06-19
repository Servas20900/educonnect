from rest_framework.routers import DefaultRouter
from .views import ViewPlaneamiento

router = DefaultRouter()
router.register(r'planeamientos', ViewPlaneamiento, basename='planeamientos')

urlpatterns = router.urls
