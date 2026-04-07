from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EvaluacionesEvaluacionViewSet, EvaluacionesCalificacionViewSet

router = DefaultRouter()
router.register(r'', EvaluacionesEvaluacionViewSet, basename='evaluacion')

urlpatterns = [
	path('calificaciones/', EvaluacionesCalificacionViewSet.as_view({'get': 'list', 'post': 'create'}), name='calificaciones-list'),
	path('calificaciones/<int:pk>/', EvaluacionesCalificacionViewSet.as_view({
		'get': 'retrieve',
		'patch': 'partial_update',
		'delete': 'destroy',
	}), name='calificaciones-detail'),
	path('', include(router.urls)),
]