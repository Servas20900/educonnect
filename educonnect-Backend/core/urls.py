from django.contrib import admin
from django.urls import path, include
from .views import ObtencionTokens, EliminacionTokens, SessionStatusView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', ObtencionTokens.as_view(), name='token_obtain_pair'),
    path('api/auth/logout/', EliminacionTokens.as_view(), name='auth_logout'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Nueva ruta para verificar sesión al recargar
    path('api/auth/session/', SessionStatusView.as_view(), name='session-status'),
    path('api/v1/', include('apps.databaseModels.urls')),
    path('api/v1/horario', include('apps.horarios.urls')),
    path('api/v1/permisos/', include('apps.permisos.urls')),
    path('api/v1/reportes/', include('apps.auditoria.urls')),
    path('api/v1/comites/', include('apps.comites.urls')),
]