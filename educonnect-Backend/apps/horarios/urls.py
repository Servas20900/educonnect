from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ViewHorariosHorario
from .views_incapacidades import ViewHorariosIncapacidad

router = DefaultRouter()
router.register(r'Horarios', ViewHorariosHorario, basename='horarios-horario')
router.register(r'incapacidades', ViewHorariosIncapacidad, basename='horarios-incapacidades')

urlpatterns = [
    path('', include(router.urls)),
]