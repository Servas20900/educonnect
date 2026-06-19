from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import ViewExportaciones

router = DefaultRouter()
router.register(r'exportaciones', ViewExportaciones, basename='exportaciones')

urlpatterns = [
    path('planilla/<int:grupo_id>/', ViewExportaciones.as_view({'get': 'planilla'}), name='exportaciones-planilla'),
]
urlpatterns += router.urls
