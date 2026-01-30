from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from .models import (
    ComunicacionesCircular, 
    HorariosHorario, 
    AuthAuditoriaLog,
    AuthRol,
    AuthPermiso
)

@receiver(post_save, sender=ComunicacionesCircular)
def log_circular_creacion(sender, instance, created, **kwargs):
    """Registra cuando se crea o modifica una circular"""
    if created:
        accion = 'Creación'
        resultado = 'Exitoso'
    else:
        accion = 'Modificación'
        resultado = 'Exitoso'
    
    AuthAuditoriaLog.objects.create(
        usuario=getattr(instance, 'creada_por', None),
        accion=accion,
        modulo='Comunicaciones',
        descripcion=f'{accion} de circular: {instance.titulo}',
        tabla_afectada='comunicaciones_circular',
        registro_id=str(instance.id),
        resultado=resultado,
        mensaje_error='',
        user_agent='',
        fecha_hora=timezone.now()
    )

@receiver(post_save, sender=HorariosHorario)
def log_horario_cambios(sender, instance, created, **kwargs):
    """Registra cambios en horarios"""
    if created:
        accion = 'Creación'
    else:
        accion = 'Modificación'
    
    AuthAuditoriaLog.objects.create(
        usuario=getattr(instance, 'creado_por', None),
        accion=accion,
        modulo='Horarios',
        descripcion=f'{accion} de horario: {instance.nombre}',
        tabla_afectada='horarios_horario',
        registro_id=str(instance.id),
        resultado='Exitoso',
        mensaje_error='',
        user_agent='',
        fecha_hora=timezone.now()
    )

@receiver(post_save, sender=AuthRol)
def log_rol_cambios(sender, instance, created, **kwargs):
    """Registra cambios en roles"""
    if created:
        accion = 'Creación'
    else:
        accion = 'Modificación'
    
    AuthAuditoriaLog.objects.create(
        accion=accion,
        modulo='Administración',
        descripcion=f'{accion} de rol: {instance.nombre}',
        tabla_afectada='auth_rol',
        registro_id=str(instance.id),
        resultado='Exitoso',
        mensaje_error='',
        user_agent='',
        fecha_hora=timezone.now()
    )

@receiver(post_delete, sender=ComunicacionesCircular)
def log_circular_eliminacion(sender, instance, **kwargs):
    """Registra cuando se elimina una circular"""
    AuthAuditoriaLog.objects.create(
        usuario=getattr(instance, 'creada_por', None),
        accion='Eliminación',
        modulo='Comunicaciones',
        descripcion=f'Eliminación de circular: {instance.titulo}',
        tabla_afectada='comunicaciones_circular',
        registro_id=str(instance.id),
        resultado='Exitoso',
        mensaje_error='',
        user_agent='',
        fecha_hora=timezone.now()
    )
