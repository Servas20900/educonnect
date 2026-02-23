from rest_framework import routers
from .views import ViewPlaneamiento

router = routers.DefaultRouter()
router.register(r'Planeamientos', ViewPlaneamiento, basename='planeamientos')

urlpatterns = router.urls