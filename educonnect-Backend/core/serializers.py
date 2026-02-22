from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from apps.databaseModels.models import AuthUsuario


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        attrs = attrs.copy()
        username_field = self.username_field
        identifier = attrs.get(username_field)

        if isinstance(identifier, str):
            normalized_identifier = identifier.strip()
            attrs[username_field] = normalized_identifier

            # Permitir login con correo o username (insensible a mayúsculas)
            if '@' in normalized_identifier:
                user = AuthUsuario.objects.filter(email__iexact=normalized_identifier).first()
            else:
                user = AuthUsuario.objects.filter(username__iexact=normalized_identifier).first()

            if user:
                attrs[username_field] = user.username

        return super().validate(attrs)
