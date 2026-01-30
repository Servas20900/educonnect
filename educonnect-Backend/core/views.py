from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.authentication import JWTAuthentication
from databaseModels.models import AuthUsuarioRol

def obtener_rol_usuario(user):
    """
    Obtiene el rol del usuario desde la BD.
    Si tiene múltiples roles, devuelve el primero.
    Si no tiene rol, crea un rol por defecto 'estudiante'.
    """
    if user.is_superuser:
        return 'administrador'
    
    usuario_rol = AuthUsuarioRol.objects.filter(usuario=user).select_related('rol').first()
    if usuario_rol and usuario_rol.rol:
        return usuario_rol.rol.nombre.lower()
    
    # Si no tiene rol, intentar crear uno por defecto
    try:
        from databaseModels.models import AuthRol
        from django.utils import timezone
        
        rol_estudiante = AuthRol.objects.filter(nombre__iexact='estudiante').first()
        if rol_estudiante:
            AuthUsuarioRol.objects.create(
                usuario=user,
                rol=rol_estudiante,
                fecha_asignacion=timezone.now()
            )
            return 'estudiante'
    except Exception as e:
        pass
    
    return 'usuario'

class ObtencionTokens(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            
            # El usuario se autentica después del super().post()
            # Necesitamos obtenerlo desde el token o desde el request data
            try:
                # Importar aquí para evitar circular imports
                from rest_framework_simplejwt.authentication import JWTAuthentication
                from rest_framework_simplejwt.tokens import AccessToken
                
                # Decodificar el token para obtener el user_id
                token = AccessToken(access_token)
                user_id = token.get('user_id')
                
                # Obtener el usuario desde la BD
                from databaseModels.models import AuthUsuario
                user = AuthUsuario.objects.get(id=user_id)
                rol = obtener_rol_usuario(user)
                
                response.set_cookie(
                    key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                    value=access_token,
                    expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                    secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                    httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                    samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
                )
                
                # Agregar información del usuario y rol a la respuesta
                response.data['user'] = user.username
                response.data['role'] = rol
                
                # Mantener los tokens en la respuesta para que el frontend los pueda guardar
                response.data['access'] = access_token
                response.data['refresh'] = refresh_token
            except Exception as e:
                # Si hay error, devolver la respuesta original
                return response
            
        return response

class EliminacionTokens(APIView):
    def post(self, request):
        response = Response({"message": "Sesión cerrada correctamente"}, status=status.HTTP_200_OK)
        
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
        
        return response

class SessionStatusView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        rol = obtener_rol_usuario(user)

        return Response({
            "isAuthenticated": True,
            "user": user.username,
            "role": rol
        })