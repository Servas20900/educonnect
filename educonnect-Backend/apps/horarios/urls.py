from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ViewHorariosHorario

router = DefaultRouter()
router.register(r'Horarios', ViewHorariosHorario, basename='horarios-horario')

urlpatterns = [
    path('', include(router.urls)),
]