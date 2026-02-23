from django.core.mail import send_mail
from django.conf import settings
from apps.databaseModels.models import PersonasPersona

class ReunionNotificationService:
    @staticmethod
    def obtener_correos_asistentes(asistentes_json):
        try:
            persona_ids = [a.get('id') for a in asistentes_json if a.get('id')]
            
            emails = PersonasPersona.objects.filter(
                id__in=persona_ids, 
                activo=True
            ).values_list('email_institucional', flat=True)
            
            return list(emails)
        except Exception as e:
            print(f"Error al obtener correos: {e}")
            return []

    @classmethod
    def notificar_participantes(cls, reunion, es_actualizacion=False):
        asunto = f"{'ACTUALIZACIÓN' if es_actualizacion else 'INVITACIÓN'}: {reunion.tema}"
        
        emails = cls.obtener_correos_asistentes(reunion.asistentes)
        
        if not emails:
            return False

        mensaje = f"""
        Saludos, se le informa sobre la siguiente reunión:
        
        Tema: {reunion.tema}
        Fecha: {reunion.fecha}
        Hora: {reunion.hora_inicio}
        Lugar: {reunion.lugar}
        Estado: {reunion.estado}
        
        Por favor, revise su calendario institucional.
        """
        
        send_mail(
            asunto, 
            mensaje, 
            settings.DEFAULT_FROM_EMAIL, 
            emails, 
            fail_silently=False
        )
        return True