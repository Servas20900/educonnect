from django.core.mail import send_mail
from django.conf import settings
from apps.databaseModels.models import AuthUsuarioRol

class HorarioNotificationService:
    @staticmethod
    def enviar_aviso_cambio(horario):
        """
        Busca a todos los estudiantes y les envía un correo sobre el cambio.
        """
        grupo_id = horario.grupo_id if horario.grupo else None
        
        if not grupo_id:
            print("DEBUG: El horario no tiene un grupo asignado. No se enviará correo.")
            return False
        
        emails_estudiantes = list(
            AuthUsuarioRol.objects.filter(
                rol__nombre__iexact='estudiante',
                usuario__is_active=True,
                usuario__grupo_id=grupo_id 
            ).values_list('usuario__email', flat=True).distinct()
        )

        destinatarios = [email for email in emails_estudiantes if email]

        if not destinatarios:
            return False

        asunto = f"⚠️ Actualización de Horario: {horario.nombre}"
        mensaje = f"""
        Hola, estudiante.
        
        Te informamos que el horario '{horario.nombre}' ha sido actualizado a la versión {horario.version}.
        
        Grupo: {horario.grupo}
        Tipo: {horario.tipo_horario}
        
        Por favor, inicia sesión en la plataforma para revisar los cambios en las aulas o bloques horarios.
        """

        try:
        
            send_mail(
                asunto,
                mensaje,
                settings.DEFAULT_FROM_EMAIL,
                destinatarios,
                fail_silently=False,
            )
            print(f"DEBUG: Correo enviado exitosamente a {len(destinatarios)} estudiantes.")
            return True
        except Exception as e:
            return False