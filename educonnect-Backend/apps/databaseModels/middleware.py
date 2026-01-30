from django.utils.deprecation import MiddlewareMixin
from django.utils import timezone
from .models import AuthAuditoriaLog
import logging

logger = logging.getLogger(__name__)

class AuditoriaMiddleware(MiddlewareMixin):
    """Middleware para registrar acciones de auditoría en el sistema"""
    
    # Rutas que NO deben auditarse (ej. endpoints de autenticación sin usuario)
    RUTAS_EXCLUIDAS = [
        '/api/auth/login/',
        '/api/auth/logout/',
        '/api/auth/refresh/',
    ]
    
    def process_request(self, request):
        """Registra intentos de acceso a endpoints protegidos"""
        request.start_time = timezone.now()
        return None
    
    def process_response(self, request, response):
        """Registra la respuesta y posibles errores"""
        # Solo auditar endpoints de API pero excluir autenticación
        if not request.path.startswith('/api/'):
            return response
        
        # Excluir rutas que no necesitan auditoría o causan problemas
        if any(request.path.startswith(ruta) for ruta in self.RUTAS_EXCLUIDAS):
            return response
        
        try:
            # Solo registrar si hay usuario autenticado
            usuario = None
            if hasattr(request, 'user') and request.user and request.user.is_authenticated:
                usuario = request.user
            else:
                # No auditar acciones sin usuario (excepto 401s en endpoints protegidos)
                return response
            
            # Determinar si fue exitoso o error
            resultado = 'Exitoso' if response.status_code < 400 else 'Error'
            mensaje_error = ''
            
            if response.status_code >= 400:
                mensaje_error = f'HTTP {response.status_code}'
            
            # Extraer módulo del path
            path_parts = request.path.split('/')
            modulo = path_parts[3] if len(path_parts) > 3 else 'API'
            
            # Obtener acción del método HTTP
            metodo_accion = {
                'GET': 'Lectura',
                'POST': 'Creación',
                'PUT': 'Actualización',
                'PATCH': 'Actualización',
                'DELETE': 'Eliminación'
            }
            accion = metodo_accion.get(request.method, request.method)
            
            # Registrar en auditoría
            try:
                AuthAuditoriaLog.objects.create(
                    usuario=usuario,
                    accion=accion,
                    modulo=modulo,
                    descripcion=f'{request.method} {request.path}',
                    tabla_afectada=modulo,
                    registro_id='',
                    resultado=resultado,
                    mensaje_error=mensaje_error,
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    fecha_hora=timezone.now()
                )
            except Exception as e:
                # Registrar el error pero no interrumpir la ejecución
                logger.error(f'Error registrando auditoría: {str(e)}')
        
        except Exception as e:
            # Capturar cualquier excepción para no afectar la respuesta
            logger.error(f'Error en middleware de auditoría: {str(e)}')
        
        return response
    
    @staticmethod
    def get_client_ip(request):
        """Obtiene la dirección IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

