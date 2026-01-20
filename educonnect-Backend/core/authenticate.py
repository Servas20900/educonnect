from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings

class AutenticacionCustomJWT(JWTAuthentication):
    """
    Obtiene el token y lo agrega a la peticion 
    """
    def authenticate(self, request):
        # Intentamos obtener el token de la cookie configurada en settings
        header = self.get_header(request)
        
        if header is None:
            raw_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE']) or None
        else:
            raw_token = self.get_raw_token(header)

        if raw_token is None:
            return None

        # Validamos el token obtenido
        validated_token = self.get_validated_token(raw_token)
        
        return self.get_user(validated_token), validated_token