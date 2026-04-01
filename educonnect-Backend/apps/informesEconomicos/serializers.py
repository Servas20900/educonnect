import cloudinary.uploader
from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from apps.databaseModels.models import DocumentosDocumento, DocumentosRepositorio
from .models import PatronatoInforme
from apps.carpetas.serializers import DocumentoReadSerializer
class InformeEconomicoWriteSerializer(serializers.ModelSerializer):
    archivo = serializers.FileField(write_only=True)
    reemplazar_id = serializers.IntegerField(required=False, write_only=True)

    class Meta:
        model = PatronatoInforme
        fields = ['id', 'titulo', 'archivo', 'reemplazar_id']

    def create(self, validated_data):
        archivo = validated_data.pop('archivo')
        reemplazar_id = validated_data.pop('reemplazar_id', None)
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
                responsable=request.user
            )

        # 2. Subida a Cloudinary
        upload_result = cloudinary.uploader.upload(
            archivo,
            folder=repo.cloudinary_path,
            resource_type="auto"
        )

        # 3. Crear el nuevo documento vinculado al informe (sea nuevo o reutilizado)
        DocumentosDocumento.objects.create(
            repositorio=repo,
            nombre=archivo.name,
            descripcion=f"Versión {version_actual} de: {informe.titulo}",
            tipo_documento="Informe",
            ruta_archivo=upload_result['secure_url'],
            tamaño_bytes=upload_result['bytes'],
            extension=archivo.name.split('.')[-1] if '.' in archivo.name else 'bin',
            mime_type=upload_result.get('format', 'pdf'),
            version=version_actual,
            documento_anterior=doc_anterior,
            hash_md5=upload_result.get('etag', ''),
            es_version_actual=True,
            etiquetas={'modulo': 'Patronato'},
            metadatos={'public_id': upload_result['public_id']},
            fecha_carga=informe.fecha_creacion,
            fecha_modificacion=informe.fecha_creacion,
            cargado_por=request.user,
            content_object=informe 
        )

        return informe
    
class InformeEconomicoReadSerializer(serializers.ModelSerializer):
    documento = serializers.SerializerMethodField()
    responsable_nombre = serializers.CharField(source='responsable.persona.nombre', read_only=True, default="N/A")

    class Meta:
        model = PatronatoInforme
        fields = ['id', 'titulo', 'fecha_creacion', 'responsable_nombre', 'estado', 'documento']

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