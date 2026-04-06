from django.urls import path
from .views import (
    RepositorioListView,
    GenericDocumentUploadView,
    DocumentosPorObjetoView,
    RepositorioDetailView,
    DocumentoRepositorioDetailView,
    DocumentoRepositorioDownloadView,
)

urlpatterns = [
    path('repositorios/', RepositorioListView.as_view(), name='repositorios-list'),
    path('items/<str:model_name>/<int:object_id>/', DocumentosPorObjetoView.as_view(), name='objeto-documentos'),
    path('upload/<str:model_name>/<int:object_id>/', GenericDocumentUploadView.as_view(), name='generic-upload'),
    path('repositorios/<int:pk>/', RepositorioDetailView.as_view(), name='repositorio-patch'),
    path(
        'repositorios/<int:repositorio_id>/documentos/<int:documento_id>/',
        DocumentoRepositorioDetailView.as_view(),
        name='repositorio-documento-detail'
    ),
    path(
        'repositorios/<int:repositorio_id>/documentos/<int:documento_id>/descargar/',
        DocumentoRepositorioDownloadView.as_view(),
        name='repositorio-documento-download'
    ),
]