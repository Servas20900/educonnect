from django.urls import path
from .views import RepositorioListView, GenericDocumentUploadView, DocumentosPorObjetoView,RepositorioDetailView

urlpatterns = [
    path('repositorios/', RepositorioListView.as_view(), name='repositorios-list'),
    path('items/<str:model_name>/<int:object_id>/', DocumentosPorObjetoView.as_view(), name='objeto-documentos'),
    path('upload/<str:model_name>/<int:object_id>/', GenericDocumentUploadView.as_view(), name='generic-upload'),
    path('repositorios/<int:pk>/', RepositorioDetailView.as_view(), name='patch')
]