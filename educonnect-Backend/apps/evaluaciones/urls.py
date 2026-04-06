from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EvaluacionesEvaluacionViewSet, EvaluacionesCalificacionViewSet

router = DefaultRouter()
router.register(r'', EvaluacionesEvaluacionViewSet, basename='evaluacion')

calificaciones_router = DefaultRouter()
calificaciones_router.register(r'calificaciones', EvaluacionesCalificacionViewSet, basename='calificacion')

urlpatterns = [
	path('', include(calificaciones_router.urls)),
	path('grupo/<int:grupo_id>/', EvaluacionesEvaluacionViewSet.as_view({'get': 'por_grupo'}), name='evaluaciones-por-grupo'),
	path('', include(router.urls)),
]
