from django.urls import path
from rest_framework import routers
from .views import ViewExportaciones

router = routers.DefaultRouter()
router.register(r'Exportaciones', ViewExportaciones, basename="exportaciones")

urlpatterns = [
	path('planilla/<int:grupo_id>/', ViewExportaciones.as_view({'get': 'planilla'}), name='exportaciones-planilla'),
]
urlpatterns += router.urls