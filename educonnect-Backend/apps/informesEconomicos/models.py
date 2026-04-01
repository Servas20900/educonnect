from django.db import models
from apps.databaseModels.models import AuthUsuario

class PatronatoInforme(models.Model):
    id = models.BigAutoField(primary_key=True)
    titulo = models.CharField(max_length=255)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    responsable = models.ForeignKey(AuthUsuario, on_delete=models.SET_NULL, null=True)
    estado = models.CharField(max_length=20, default='Activo')

    class Meta:
        db_table = 'patronato_informe'

    def __str__(self):
        return self.titulo