from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AcademicoGrupoViewSet, AcademicoGradoViewSet

router = DefaultRouter()
router.register(r'grados', AcademicoGradoViewSet, basename='grados')
router.register(r'grupos', AcademicoGrupoViewSet, basename='grupos')

urlpatterns = [
    path('', include(router.urls)),
]