from rest_framework import serializers
from apps.databaseModels.models import DocumentosRepositorio, DocumentosDocumento

class DocumentoReadSerializer(serializers.ModelSerializer):
    url_descarga = serializers.SerializerMethodField()
    nombre_cargado_por = serializers.SerializerMethodField()
    tamaño_legible = serializers.SerializerMethodField()

    class Meta:
        model = DocumentosDocumento
        fields = [
            'id', 'nombre', 'descripcion', 'version', 'es_version_actual',
            'ruta_archivo', 'url_descarga', 'extension', 'tipo_documento',
            'tamaño_bytes', 'tamaño_legible', 'fecha_carga', 'nombre_cargado_por'
        ]

    def get_url_descarga(self, obj):
        public_id = obj.metadatos.get('public_id')
        if not public_id:
            return obj.ruta_archivo
        
        partes = obj.ruta_archivo.split('/upload/')
        if len(partes) == 2:
            return f"{partes[0]}/upload/fl_attachment/{partes[1]}"
        return obj.ruta_archivo

    def get_nombre_cargado_por(self, obj):
        if obj.cargado_por and obj.cargado_por.persona:
            persona = obj.cargado_por.persona
            return f"{persona.nombre} {persona.primer_apellido}"
        return "Sistema"

    def get_tamaño_legible(self, obj):
        num = obj.tamaño_bytes
        for unit in ['B', 'KB', 'MB', 'GB']:
            if num < 1024.0:
                return f"{num:.1f} {unit}"
            num /= 1024.0
        return f"{num:.1f} TB"


class RepositorioSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.CharField(source='creado_por.username', read_only=True)
    conteo_documentos = serializers.SerializerMethodField()

    class Meta:
        model = DocumentosRepositorio
        fields = [
            'id', 'nombre', 'descripcion', 'cloudinary_path', 
            'rol_acceso', 'puede_escribir', 'fecha_creacion', 
            'creado_por_nombre', 'conteo_documentos'
        ]
        extra_kwargs = {
            'creado_por': {'read_only': True}
        }

    def get_conteo_documentos(self, obj):
        return DocumentosDocumento.objects.filter(
            repositorio=obj, 
            es_version_actual=True
        ).count()

