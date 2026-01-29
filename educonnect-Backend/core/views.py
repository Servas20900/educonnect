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
    Si no tiene rol, devuelve 'usuario' como rol por defecto.
    """
    if user.is_superuser:
        return 'administrador'
    
    usuario_rol = AuthUsuarioRol.objects.filter(usuario=user).select_related('rol').first()
    if usuario_rol and usuario_rol.rol:
        return usuario_rol.rol.nombre.lower()
    
    return 'usuario'

class ObtencionTokens(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            access_token = response.data.get('access')
            # Obtener el usuario y su rol
            user = request.user
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
            
            if 'access' in response.data:
                del response.data['access']
            
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