from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import HttpResponse
from django.contrib.contenttypes.models import ContentType
from rest_framework.generics import get_object_or_404
from django.utils import timezone
from urllib.parse import quote
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import ssl
import logging
import unicodedata
from cloudinary.utils import cloudinary_url
from cloudinary.utils import private_download_url
from apps.databaseModels.models import DocumentosRepositorio, DocumentosDocumento, AuthUsuarioRol
from core.views import obtener_rol_usuario
from .services import DocumentService
from .serializers import DocumentoReadSerializer, RepositorioSerializer, DocumentoUpdateSerializer


logger = logging.getLogger(__name__)
DOWNLOAD_TIMEOUT_SECONDS = 20


def _normalizar_nombre_rol(valor):
    limpio = unicodedata.normalize('NFKD', str(valor or ''))
    limpio = ''.join(ch for ch in limpio if not unicodedata.combining(ch))
    return limpio.strip().lower()


def _normalizar_roles(valor_roles):
    if not valor_roles:
        return set()

    roles = [parte.strip().lower() for parte in str(valor_roles).split(',')]
    return {rol for rol in roles if rol}


def _to_bool(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {'1', 'true', 't', 'yes', 'y', 'si'}


def _es_admin(user):
    if getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False):
        return True

    nombres_roles = AuthUsuarioRol.objects.filter(usuario=user).values_list('rol__nombre', flat=True)
    aliases_admin = {'administrador', 'administracion', 'admin'}
    return any(_normalizar_nombre_rol(nombre) in aliases_admin for nombre in nombres_roles)


def _usuario_puede_leer_repositorio(user, repositorio):
    if _es_admin(user):
        return True

    rol = (obtener_rol_usuario(user) or '').lower()
    if rol != 'docente':
        return False

    roles_permitidos = _normalizar_roles(repositorio.rol_acceso)

    if not roles_permitidos:
        return False

    return rol in roles_permitidos


def _validar_admin_o_403(user):
    if not _es_admin(user):
        return Response(
            {"error": "Solo administración puede realizar esta acción."},
            status=status.HTTP_403_FORBIDDEN,
        )
    return None


def _nombre_descarga_documento(documento):
    base = str(documento.nombre or 'documento').strip() or 'documento'
    extension = str(documento.extension or '').strip().lstrip('.')

    if extension and not base.lower().endswith(f'.{extension.lower()}'):
        return f'{base}.{extension}'

    return base


def _urls_descarga_documento(documento):
    candidatos = []

    def agregar(url):
        valor = str(url or '').strip()
        if valor and valor not in candidatos:
            candidatos.append(valor)

    agregar(documento.ruta_archivo)

    metadatos = documento.metadatos or {}
    public_id = str(metadatos.get('public_id') or '').strip()
    if public_id:
        version = metadatos.get('version_cloudinary')
        extension = str(documento.extension or '').strip().lstrip('.') or None

        resource_types = []
        tipo = str(documento.tipo_documento or '').strip().lower()
        if tipo:
            resource_types.append(tipo)
        resource_types.extend(['raw', 'image', 'auto'])

        for resource_type in resource_types:
            if not resource_type:
                continue

            options = {
                'resource_type': resource_type,
                'secure': True,
                'flags': 'attachment',
            }
            if extension:
                options['format'] = extension
            if version:
                options['version'] = version

            generated_url, _ = cloudinary_url(public_id, **options)
            agregar(generated_url)

    return candidatos


def _descargar_remoto(url):
    remote_request = Request(
        url,
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*',
        },
    )

    try:
        with urlopen(remote_request, timeout=DOWNLOAD_TIMEOUT_SECONDS) as remote_file:
            return remote_file.read(), remote_file.headers.get_content_type()
    except URLError as error:
        if isinstance(getattr(error, 'reason', None), ssl.SSLCertVerificationError):
            insecure_context = ssl._create_unverified_context()
            with urlopen(
                remote_request,
                timeout=DOWNLOAD_TIMEOUT_SECONDS,
                context=insecure_context,
            ) as remote_file:
                return remote_file.read(), remote_file.headers.get_content_type()
        raise

class RepositorioListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        repositorios = list(DocumentosRepositorio.objects.all().order_by('-fecha_creacion'))

        if not _es_admin(request.user):
            repositorios = [
                repo for repo in repositorios if _usuario_puede_leer_repositorio(request.user, repo)
            ]

        serializer = RepositorioSerializer(repositorios, many=True)
        return Response(serializer.data)

    def post(self, request):
        error_admin = _validar_admin_o_403(request.user)
        if error_admin:
            return error_admin

        data = request.data.copy()
        data['rol_acceso'] = 'docente'
        serializer = RepositorioSerializer(data=data)
        
        if serializer.is_valid():
            serializer.save(creado_por=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GenericDocumentUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, model_name, object_id):
        error_admin = _validar_admin_o_403(request.user)
        if error_admin:
            return error_admin

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
        repositorio = get_object_or_404(DocumentosRepositorio, id=object_id)

        if not _usuario_puede_leer_repositorio(request.user, repositorio):
            return Response(
                {"error": "No tenés permiso para ver esta carpeta"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            ct = ContentType.objects.get(model=model_name.lower())
            include_archivados = _to_bool(request.query_params.get('include_archivados'))
            archivados_only = _to_bool(request.query_params.get('archivados_only'))

            # Docentes y otros no admin solo deben ver documentos activos.
            if not _es_admin(request.user):
                include_archivados = False
                archivados_only = False

            documentos = DocumentosDocumento.objects.filter(
                content_type=ct,
                object_id=object_id,
            ).order_by('-fecha_carga')

            if archivados_only:
                documentos = documentos.filter(es_version_actual=False)
            elif not include_archivados:
                documentos = documentos.filter(es_version_actual=True)
            
            serializer = DocumentoReadSerializer(documentos, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class RepositorioDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        error_admin = _validar_admin_o_403(request.user)
        if error_admin:
            return error_admin

        repositorio = get_object_or_404(DocumentosRepositorio, pk=pk)
        data = request.data.copy()
        data['rol_acceso'] = 'docente'
        serializer = RepositorioSerializer(repositorio, data=data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        error_admin = _validar_admin_o_403(request.user)
        if error_admin:
            return error_admin

        repositorio = get_object_or_404(DocumentosRepositorio, pk=pk)
        tiene_documentos_activos = DocumentosDocumento.objects.filter(
            repositorio_id=pk,
            es_version_actual=True,
        ).exists()

        if tiene_documentos_activos:
            return Response(
                {"error": "No se puede eliminar la carpeta porque contiene documentos activos."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        repositorio.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DocumentoRepositorioDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, repositorio_id, documento_id):
        error_admin = _validar_admin_o_403(request.user)
        if error_admin:
            return error_admin

        documento = get_object_or_404(
            DocumentosDocumento,
            id=documento_id,
            repositorio_id=repositorio_id,
        )

        if 'archivado' in request.data:
            archivado = _to_bool(request.data.get('archivado'))
            documento.es_version_actual = not archivado
            documento.fecha_modificacion = timezone.now()
            documento.save(update_fields=['es_version_actual', 'fecha_modificacion'])
            return Response(DocumentoReadSerializer(documento).data)

        serializer = DocumentoUpdateSerializer(documento, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save(fecha_modificacion=timezone.now())
            return Response(DocumentoReadSerializer(documento).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, repositorio_id, documento_id):
        error_admin = _validar_admin_o_403(request.user)
        if error_admin:
            return error_admin

        documento = get_object_or_404(
            DocumentosDocumento,
            id=documento_id,
            repositorio_id=repositorio_id,
            es_version_actual=True,
        )
        documento.es_version_actual = False
        documento.fecha_modificacion = timezone.now()
        documento.save(update_fields=['es_version_actual', 'fecha_modificacion'])

        return Response(
            {"message": "Documento archivado correctamente."},
            status=status.HTTP_200_OK,
        )


class DocumentoRepositorioDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, repositorio_id, documento_id):
        documento = get_object_or_404(
            DocumentosDocumento,
            id=documento_id,
            repositorio_id=repositorio_id,
            es_version_actual=True,
        )

        repositorio = documento.repositorio
        if not repositorio or not _usuario_puede_leer_repositorio(request.user, repositorio):
            return Response(
                {"error": "No tenés permiso para descargar este documento"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not documento.ruta_archivo:
            return Response(
                {"error": "El documento no tiene una ruta de descarga válida"},
                status=status.HTTP_404_NOT_FOUND,
            )

        content = None
        remote_content_type = None
        errores_descarga = []

        # Intento 1: URLs directas y transformadas.
        for url_descarga in _urls_descarga_documento(documento):
            try:
                content, remote_content_type = _descargar_remoto(url_descarga)
                break
            except HTTPError as error:
                errores_descarga.append(f'{url_descarga} -> HTTPError {error.code}: {error.reason}')
            except URLError as error:
                errores_descarga.append(
                    f'{url_descarga} -> URLError {type(error.reason).__name__ if getattr(error, "reason", None) else "Unknown"}: {error}'
                )
            except Exception as error:
                errores_descarga.append(f'{url_descarga} -> {type(error).__name__}: {error}')

        # Intento 2: URL firmada (private_download_url) para cuentas con acceso restringido.
        if not content:
            public_id = str((documento.metadatos or {}).get('public_id') or '').strip()
            extension = str(documento.extension or '').strip().lstrip('.') or None
            if public_id:
                candidate_pairs = [
                    ('raw', 'upload'),
                    ('raw', 'authenticated'),
                    ('image', 'upload'),
                    ('image', 'authenticated'),
                ]

                for resource_type, delivery_type in candidate_pairs:
                    try:
                        signed_url = private_download_url(
                            public_id=public_id,
                            format=extension,
                            resource_type=resource_type,
                            type=delivery_type,
                            attachment=True,
                        )
                        content, remote_content_type = _descargar_remoto(signed_url)
                        break
                    except HTTPError as error:
                        errores_descarga.append(
                            f'signed:{resource_type}/{delivery_type} -> HTTPError {error.code}: {error.reason}'
                        )
                    except URLError as error:
                        errores_descarga.append(
                            f'signed:{resource_type}/{delivery_type} -> URLError '
                            f'{type(error.reason).__name__ if getattr(error, "reason", None) else "Unknown"}: {error}'
                        )
                    except Exception as error:
                        errores_descarga.append(
                            f'signed:{resource_type}/{delivery_type} -> {type(error).__name__}: {error}'
                        )

                    if content:
                        break

        if not content:
            logger.error(
                'No se pudo descargar documento %s. Intentos: %s',
                documento.id,
                ' | '.join(errores_descarga)[:4000],
            )
            return Response(
                {"error": "No se pudo obtener el archivo desde el repositorio de archivos"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        filename = _nombre_descarga_documento(documento)
        encoded_filename = quote(filename)

        response = HttpResponse(
            content,
            content_type=documento.mime_type or remote_content_type or 'application/octet-stream',
        )
        response['Content-Disposition'] = (
            f"attachment; filename=\"{filename}\"; filename*=UTF-8''{encoded_filename}"
        )
        return response