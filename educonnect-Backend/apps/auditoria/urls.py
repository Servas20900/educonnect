from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ViewAuthAuditoriaLog

router = DefaultRouter()
router.register(r'auditoria', ViewAuthAuditoriaLog, basename='auditoria')

urlpatterns = [
    path('', include(router.urls)),
]
