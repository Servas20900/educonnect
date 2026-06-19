from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from .views import (
    ObtencionTokens,
    EliminacionTokens,
    SessionStatusView,
    RefreshDesdeCookieView,
    ChangePasswordView,
)

# ─── Autenticación ────────────────────────────────────────────────────────────
auth_patterns = [
    path('login/',           ObtencionTokens.as_view(),        name='token_obtain_pair'),
    path('logout/',          EliminacionTokens.as_view(),       name='auth_logout'),
    path('refresh/',         RefreshDesdeCookieView.as_view(),  name='token_refresh'),
    path('session/',         SessionStatusView.as_view(),       name='session-status'),
    path('change-password/', ChangePasswordView.as_view(),      name='change-password'),
]

# ─── API v1 ───────────────────────────────────────────────────────────────────
api_v1_patterns = [
    # Recursos base (circulares, comunicados, grupos, matrícula)
    path('',                      include('apps.databaseModels.urls')),
    # Módulos por dominio
    path('asignatura/',           include('apps.asignatura.urls')),
    path('asistencia/',           include('apps.asistencia.urls')),
    path('auditoria/',            include('apps.auditoria.urls')),
    path('carpetas/',             include('apps.carpetas.urls')),
    path('comites/',              include('apps.comites.urls')),
    path('evaluaciones/',         include('apps.evaluaciones.urls')),
    path('exportaciones/',        include('apps.exportaciones.urls')),
    path('grupo/',                include('apps.grupo.urls')),
    path('horario/',              include('apps.horarios.urls')),
    path('informes-economicos/',  include('apps.informesEconomicos.urls')),
    path('notificaciones/',       include('apps.notificaciones.urls')),
    path('oficios-plantillas/',   include('apps.oficiosPlantillas.urls')),
    path('permisos/',             include('apps.permisos.urls')),
    path('planeamientos/',        include('apps.planeamientos.urls')),
    path('reuniones/',            include('apps.reuniones.urls')),
    path('usuarios/',             include('apps.usuarios.urls')),
]

urlpatterns = [
    path('admin/',    admin.site.urls),
    path('api/auth/', include(auth_patterns)),
    path('api/v1/',   include(api_v1_patterns)),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
