from django.db import models
from apps.databaseModels.models import AuthUsuario

class PreferenciaNotificacion(models.Model):
    usuario = models.OneToOneField(
        AuthUsuario,
        on_delete=models.CASCADE,
        related_name="preferencia_notificacion"
    )
    recibir_profesor_hogar = models.BooleanField(default=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table = "comunicaciones_preferencia_notificacion"