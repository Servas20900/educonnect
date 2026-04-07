import cloudinary.uploader
from rest_framework import serializers
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from apps.databaseModels.models import DocumentosDocumento, DocumentosRepositorio
from .models import PatronatoInforme
from apps.carpetas.serializers import DocumentoReadSerializer
class InformeEconomicoWriteSerializer(serializers.ModelSerializer):
    archivo = serializers.FileField(write_only=True)
    reemplazar_id = serializers.IntegerField(required=False, write_only=True)
    categoria = serializers.CharField(required=False)

    class Meta:
        model = PatronatoInforme
        fields = ['id', 'titulo', 'categoria', 'archivo', 'reemplazar_id']

    @staticmethod
    def _cloudinary_error_permite_fallback(error):
        mensaje = str(error or '').lower()
        return any(
            token in mensaje
            for token in (
                'cloud_name is disabled',
                'must supply',
                'api key',
                'api_secret',
                'authorization',
            )
        )

    @staticmethod
    def _subir_local(archivo, folder_path):
        local_storage = FileSystemStorage(
            location=settings.MEDIA_ROOT,
            base_url=settings.MEDIA_URL,
        )
        storage_path = local_storage.save(f"{folder_path}/{archivo.name}", archivo)
        return {
            'secure_url': local_storage.url(storage_path),
            'bytes': int(getattr(archivo, 'size', 0) or 0),
            'format': (archivo.name.split('.')[-1].lower() if '.' in archivo.name else 'bin'),
            'etag': '',
            'public_id': None,
            'storage_path': storage_path,
        }

    @classmethod
    def _subir_archivo(cls, archivo, folder_path):
        if settings.USE_CLOUDINARY:
            try:
                return cloudinary.uploader.upload(
                    archivo,
                    folder=folder_path,
                    resource_type='auto',
                )
            except Exception as error:
                if settings.DEBUG and cls._cloudinary_error_permite_fallback(error):
                    archivo.seek(0)
                    return cls._subir_local(archivo, folder_path)
                raise

        return cls._subir_local(archivo, folder_path)

    def create(self, validated_data):
        archivo = validated_data.pop('archivo')
        reemplazar_id = validated_data.pop('reemplazar_id', None)
        categoria = validated_data.get('categoria', 'economico')
        request = self.context.get('request')

        # 1. Asegurar repositorio (esto se queda igual)
        repo, _ = DocumentosRepositorio.objects.get_or_create(
            cloudinary_path='patronato/informes',
            defaults={'nombre': "Informes Patronato", 'rol_acceso': 'Administrador', 'puede_escribir': True}
        )

        version_actual = 1
        doc_anterior = None
        
        if reemplazar_id:
            informe = PatronatoInforme.objects.get(id=reemplazar_id)
            informe.titulo = validated_data.get('titulo', informe.titulo)
            informe.categoria = categoria
            informe.save()

            ultimo_doc = DocumentosDocumento.objects.filter(
                content_type=ContentType.objects.get_for_model(PatronatoInforme),
                object_id=informe.id,
                es_version_actual=True
            ).first()
            
            if ultimo_doc:
                version_actual = ultimo_doc.version + 1
                ultimo_doc.es_version_actual = False
                ultimo_doc.save()
                doc_anterior = ultimo_doc
        else:
            # Si no hay reemplazar_id, sí es un informe nuevo desde cero
            informe = PatronatoInforme.objects.create(
                titulo=validated_data['titulo'],
                categoria=categoria,
                responsable=request.user
            )

        # 2. Subida (Cloudinary con fallback local)
        upload_result = self._subir_archivo(archivo, repo.cloudinary_path)
        ahora = timezone.now()

        # 3. Crear el nuevo documento vinculado al informe (sea nuevo o reutilizado)
        DocumentosDocumento.objects.create(
            repositorio=repo,
            nombre=archivo.name,
            descripcion=f"Versión {version_actual} de: {informe.titulo}",
            tipo_documento="Informe",
            ruta_archivo=upload_result['secure_url'],
            tamaño_bytes=upload_result['bytes'],
            extension=archivo.name.split('.')[-1] if '.' in archivo.name else 'bin',
            mime_type=(str(getattr(archivo, 'content_type', '') or '').strip() or 'application/octet-stream'),
            version=version_actual,
            documento_anterior=doc_anterior,
            hash_md5=upload_result.get('etag', ''),
            es_version_actual=True,
            etiquetas={'modulo': 'Patronato'},
            metadatos={
                'public_id': upload_result.get('public_id'),
                'storage_backend': 'local' if upload_result.get('storage_path') else 'cloudinary',
                'local_storage_path': upload_result.get('storage_path'),
            },
            fecha_carga=ahora,
            fecha_modificacion=ahora,
            cargado_por=request.user,
            content_object=informe 
        )

        return informe
    
class InformeEconomicoReadSerializer(serializers.ModelSerializer):
    documento = serializers.SerializerMethodField()
    responsable_nombre = serializers.CharField(source='responsable.persona.nombre', read_only=True, default="N/A")

    class Meta:
        model = PatronatoInforme
        fields = ['id', 'titulo', 'categoria', 'fecha_creacion', 'responsable_nombre', 'estado', 'documento']

    def get_documento(self, obj):
        # Buscamos el documento actual
        doc = DocumentosDocumento.objects.filter(
            content_type=ContentType.objects.get_for_model(obj),
            object_id=obj.id,
            es_version_actual=True
        ).first()
        
        if doc:
            return DocumentoReadSerializer(doc).data
        return None