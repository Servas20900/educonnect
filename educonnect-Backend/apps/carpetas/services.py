import cloudinary.uploader
import hashlib
import os
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.db import transaction
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from apps.databaseModels.models import DocumentosDocumento

class DocumentService:
    RAW_EXTENSIONS = {
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
        'txt', 'csv', 'zip', 'rar', '7z', 'odt', 'ods', 'rtf'
    }

    @staticmethod
    def _generar_hash(archivo):
        md5 = hashlib.md5()
        for chunk in archivo.chunks():
            md5.update(chunk)
        return md5.hexdigest()

    @staticmethod
    def _obtener_extension(nombre_archivo):
        return os.path.splitext(str(nombre_archivo or ''))[1].lower().lstrip('.')

    @classmethod
    def _resolver_tipo_recurso(cls, archivo):
        extension = cls._obtener_extension(getattr(archivo, 'name', ''))
        if extension in cls.RAW_EXTENSIONS:
            return 'raw'

        content_type = str(getattr(archivo, 'content_type', '') or '').lower()
        if content_type.startswith('image/'):
            return 'image'
        if content_type.startswith('video/'):
            return 'video'

        return 'raw'

    @staticmethod
    def _subir_a_storage_local(archivo, folder_path, resource_type):
        local_storage = FileSystemStorage(
            location=settings.MEDIA_ROOT,
            base_url=settings.MEDIA_URL,
        )
        storage_path = local_storage.save(f"{folder_path}/{archivo.name}", archivo)

        return {
            'resource_type': resource_type,
            'secure_url': local_storage.url(storage_path),
            'bytes': int(getattr(archivo, 'size', 0) or 0),
            'format': DocumentService._obtener_extension(archivo.name) or 'bin',
            'public_id': None,
            'version': None,
            'storage_path': storage_path,
        }

    @staticmethod
    def _permite_fallback_local_por_error_cloudinary(error):
        mensaje = str(error or '').lower()
        errores_conocidos = (
            'must supply',
            'cloud_name is disabled',
            'api key',
            'api_secret',
            'authorization',
        )
        return any(texto in mensaje for texto in errores_conocidos)

    @classmethod
    def procesar_subida(cls, archivo, objeto_destino, usuario, descripcion=""):
        archivo_hash = cls._generar_hash(archivo)
        
        archivo.seek(0) 

        target_content_type = ContentType.objects.get_for_model(objeto_destino)
        
        nombre_modelo = objeto_destino._meta.model_name
        base_folder = "home/educonnect"
        if nombre_modelo == 'documentosrepositorio':
            folder_path = f"{base_folder}/documentos_institucionales/repositorio_{objeto_destino.id}"
        elif nombre_modelo == 'horarioshorario':
            folder_path = f"{base_folder}/horarios/horario_{objeto_destino.id}"
        else:
            folder_path = f"{base_folder}/{nombre_modelo}/{objeto_destino.id}"

        resource_type = cls._resolver_tipo_recurso(archivo)

        upload_options = {
            # Usamos solo `folder` para evitar árboles paralelos en cuentas con modos DAM distintos.
            'folder': folder_path,
            'resource_type': resource_type,
            'use_filename': True,
            'unique_filename': True,
        }

        if settings.USE_CLOUDINARY:
            try:
                resultado = cloudinary.uploader.upload(archivo, **upload_options)
            except Exception as error:
                if settings.DEBUG and cls._permite_fallback_local_por_error_cloudinary(error):
                    archivo.seek(0)
                    resultado = cls._subir_a_storage_local(archivo, folder_path, resource_type)
                else:
                    raise
        else:
            resultado = cls._subir_a_storage_local(archivo, folder_path, resource_type)

        with transaction.atomic():
            version_anterior = DocumentosDocumento.objects.filter(
                content_type=target_content_type,
                object_id=objeto_destino.id,
                nombre=archivo.name,
                es_version_actual=True
            ).first()

            nueva_version = (version_anterior.version + 1) if version_anterior else 1

            if version_anterior:
                version_anterior.es_version_actual = False
                version_anterior.save()

            nuevo_doc = DocumentosDocumento.objects.create(
                repositorio=objeto_destino if nombre_modelo == 'documentosrepositorio' else None,
                
                content_type=target_content_type,
                object_id=objeto_destino.id,
                
                nombre=archivo.name,
                descripcion=descripcion,
                tipo_documento=resultado.get('resource_type'),
                ruta_archivo=resultado.get('secure_url'),
                tamaño_bytes=resultado.get('bytes'),
                extension=resultado.get('format', cls._obtener_extension(archivo.name) or 'bin'),
                mime_type=(
                    str(getattr(archivo, 'content_type', '') or '').strip()
                    or f"{resultado.get('resource_type')}/{resultado.get('format', 'octet-stream')}"
                ),
                version=nueva_version,
                documento_anterior=version_anterior,
                hash_md5=archivo_hash,
                es_version_actual=True,
                etiquetas={},
                metadatos={
                    "public_id": resultado.get('public_id'),
                    "version_cloudinary": resultado.get('version'),
                    "cloudinary_folder": folder_path,
                    "resource_type": resource_type,
                    "storage_backend": 'local' if resultado.get('storage_path') else 'cloudinary',
                    "local_storage_path": resultado.get('storage_path'),
                },
                fecha_carga=timezone.now(),
                fecha_modificacion=timezone.now(),
                cargado_por=usuario
            )
            
            return nuevo_doc