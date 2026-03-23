from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ViewAuthAuditoriaLog,
    reporte_uso_sistema,
    reporte_por_modulo,
    reporte_errores,
)

router = DefaultRouter()
router.register(r'auditoria', ViewAuthAuditoriaLog, basename='auditoria')

urlpatterns = [
    path('reporte_uso_sistema/', reporte_uso_sistema, name='reporte_uso_sistema'),
    path('reporte_por_modulo/', reporte_por_modulo, name='reporte_por_modulo'),
    path('reporte_errores/', reporte_errores, name='reporte_errores'),
    path('', include(router.urls)),
]
