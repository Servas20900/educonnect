import cloudinary.uploader
import hashlib
from django.db import transaction
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from apps.databaseModels.models import DocumentosDocumento

class DocumentService:
    @staticmethod
    def _generar_hash(archivo):
        md5 = hashlib.md5()
        for chunk in archivo.chunks():
            md5.update(chunk)
        return md5.hexdigest()

    @classmethod
    def procesar_subida(cls, archivo, objeto_destino, usuario, descripcion=""):
        archivo_hash = cls._generar_hash(archivo)
        
        archivo.seek(0) 

        target_content_type = ContentType.objects.get_for_model(objeto_destino)
        
        nombre_modelo = objeto_destino._meta.model_name
        folder_path = f"educonnect/{nombre_modelo}/{objeto_destino.id}"

        resultado = cloudinary.uploader.upload(
            archivo,
            folder=folder_path, 
            resource_type="auto"
        )

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
                extension=resultado.get('format', archivo.name.split('.')[-1]),
                mime_type=f"{resultado.get('resource_type')}/{resultado.get('format')}",
                version=nueva_version,
                documento_anterior=version_anterior,
                hash_md5=archivo_hash,
                es_version_actual=True,
                etiquetas={},
                metadatos={
                    "public_id": resultado.get('public_id'),
                    "version_cloudinary": resultado.get('version')
                },
                fecha_carga=timezone.now(),
                fecha_modificacion=timezone.now(),
                cargado_por=usuario
            )
            
            return nuevo_doc