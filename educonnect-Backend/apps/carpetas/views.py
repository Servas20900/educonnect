from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.contenttypes.models import ContentType
from rest_framework.generics import get_object_or_404
from apps.databaseModels.models import DocumentosRepositorio, DocumentosDocumento
from core.views import obtener_rol_usuario
from .services import DocumentService
from .serializers import DocumentoReadSerializer, RepositorioSerializer

class RepositorioListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        repositorios = DocumentosRepositorio.objects.all().order_by('-fecha_creacion')
        serializer = RepositorioSerializer(repositorios, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = RepositorioSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(creado_por=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GenericDocumentUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, model_name, object_id):
        archivo = request.FILES.get('file')
        descripcion = request.data.get('descripcion', '')

        if not archivo:
            return Response(
                {"error": "No se proporcionó ningún archivo binario."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            try:
                ct = ContentType.objects.get(model=model_name.lower())
                objeto_destino = ct.get_object_for_this_type(id=object_id)
            except ContentType.DoesNotExist:
                return Response(
                    {"error": f"El modelo '{model_name}' no está registrado en el sistema."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception:
                return Response(
                    {"error": f"No se encontró el objeto con ID {object_id} en {model_name}."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            documento = DocumentService.procesar_subida(
                archivo=archivo,
                objeto_destino=objeto_destino,
                usuario=request.user,
                descripcion=descripcion
            )

            serializer = DocumentoReadSerializer(documento)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": f"Fallo interno en la subida: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DocumentosPorObjetoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, model_name, object_id):
        rol = obtener_rol_usuario(request.user)
        if rol != 'administrador':
            repositorio = get_object_or_404(
                DocumentosRepositorio, id=object_id
            )
            if repositorio.rol_acceso and rol not in repositorio.rol_acceso:
                return Response(
                    {"error": "No tenés permiso para ver esta carpeta"},
                    status=403
                )
        try:
            ct = ContentType.objects.get(model=model_name.lower())
            documentos = DocumentosDocumento.objects.filter(
                content_type=ct,
                object_id=object_id,
                es_version_actual=True
            ).order_by('-fecha_carga')
            
            serializer = DocumentoReadSerializer(documentos, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class RepositorioDetailView(APIView):
    def patch(self, request, pk):
        repositorio = get_object_or_404(DocumentosRepositorio, pk=pk)
        serializer = RepositorioSerializer(repositorio, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)