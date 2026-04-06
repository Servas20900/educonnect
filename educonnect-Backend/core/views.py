from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from apps.databaseModels.models import AuthUsuarioRol
from .serializers import CustomTokenObtainPairSerializer

def obtener_roles_usuario(user):
    """
    Obtiene todos los roles del usuario desde la BD en formato lista.
    Si no tiene rol, intenta crear rol por defecto 'estudiante'.
    """
    if user.is_superuser:
        return ['administrador']

    roles = list(
        AuthUsuarioRol.objects.filter(usuario=user)
        .select_related('rol')
        .values_list('rol__nombre', flat=True)
    )
    roles = [r.lower() for r in roles if r]

    if roles:
        return roles

    # Si no tiene rol, intentar crear uno por defecto
    try:
        from apps.databaseModels.models import AuthRol
        from django.utils import timezone

        rol_estudiante = AuthRol.objects.filter(nombre__iexact='estudiante').first()
        if rol_estudiante:
            AuthUsuarioRol.objects.create(
                usuario=user,
                rol=rol_estudiante,
                fecha_asignacion=timezone.now()
            )
            return ['estudiante']
    except Exception:
        pass

    return ['usuario']

def obtener_rol_usuario(user):
    """
    Obtiene el rol del usuario desde la BD.
    Si tiene múltiples roles, devuelve el primero.
    Si no tiene rol, crea un rol por defecto 'estudiante'.
    """
    roles = obtener_roles_usuario(user)
    return roles[0] if roles else 'usuario'

class ObtencionTokens(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

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
                from apps.databaseModels.models import AuthUsuario
                user = AuthUsuario.objects.get(id=user_id)
                roles = obtener_roles_usuario(user)
                
                response.set_cookie(
                    key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                    value=access_token,
                    expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                    secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                    httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                    samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
                )

                response.set_cookie(
                    key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
                    value=refresh_token,
                    expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
                    secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                    httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                    samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
                )
                
                # Agregar información del usuario y rol a la respuesta
                response.data['user'] = user.username
                response.data['role'] = roles[0] if roles else None
                response.data['roles'] = roles
                
                # Mantener los tokens en la respuesta para que el frontend los pueda guardar
                response.data['access'] = access_token
                response.data['refresh'] = refresh_token
            except Exception as e:
                # Si hay error, devolver la respuesta original
                return response
            
        return response


class RefreshDesdeCookieView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        data = request.data.copy()
        if not data.get('refresh'):
            cookie_refresh = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
            if cookie_refresh:
                data['refresh'] = cookie_refresh

        serializer = self.get_serializer(data=data)

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as exc:
            raise InvalidToken(exc.args[0])

        response = Response(serializer.validated_data, status=status.HTTP_200_OK)

        access_token = serializer.validated_data.get('access')
        if access_token:
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                value=access_token,
                expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )

        rotated_refresh = serializer.validated_data.get('refresh')
        if rotated_refresh:
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
                value=rotated_refresh,
                expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )

        return response

class EliminacionTokens(APIView):
    def post(self, request):
        response = Response({"message": "Sesión cerrada correctamente"}, status=status.HTTP_200_OK)
        
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
        
        return response

class SessionStatusView(APIView):
    # Keep this endpoint non-erroring for guests; frontend uses it to know auth state.
    permission_classes = [AllowAny]

    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response({"isAuthenticated": False}, status=status.HTTP_200_OK)

        user = request.user
        roles = obtener_roles_usuario(user)

        return Response({
            "isAuthenticated": True,
            "user": user.username,
            "role": roles[0] if roles else None,
            "roles": roles,
        })