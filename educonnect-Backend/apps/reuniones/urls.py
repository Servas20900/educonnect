from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReunionViewSet, ActaViewSet, CompartirActaView

router = DefaultRouter()
router.register(r'reuniones', ReunionViewSet)
router.register(r'actas', ActaViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('actas/<int:acta_id>/compartir/', CompartirActaView.as_view(), name='compartir-acta'),
]