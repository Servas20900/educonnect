from rest_framework import serializers
from .models import Planeamiento


class PlaneamientoSerializer(serializers.ModelSerializer):
    docente_nombre = serializers.SerializerMethodField()
    revisado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Planeamiento
        fields = "__all__"
        read_only_fields = [
            "docente",
            "estado",
            "fecha_envio",
            "creado",
            "actualizado",
            "fecha_revision",
            "revisado_por",
        ]

    def validate(self, attrs):
        request = self.context.get("request")
        if request and request.method == "POST":
            if not attrs.get("titulo"):
                raise serializers.ValidationError({"titulo": "El titulo es requerido."})
            if not attrs.get("detalle"):
                raise serializers.ValidationError({"detalle": "El detalle es requerido."})
            if not attrs.get("archivo"):
                raise serializers.ValidationError({"archivo": "Debes adjuntar un documento."})
        return attrs

    def get_docente_nombre(self, obj):
        persona = getattr(obj.docente, "persona", None)
        if persona:
            return f"{persona.nombre} {persona.primer_apellido} {persona.segundo_apellido or ''}".strip()
        return obj.docente.username

    def get_revisado_por_nombre(self, obj):
        if not obj.revisado_por:
            return ""

        persona = getattr(obj.revisado_por, "persona", None)
        if persona:
            return f"{persona.nombre} {persona.primer_apellido} {persona.segundo_apellido or ''}".strip()
        return obj.revisado_por.username