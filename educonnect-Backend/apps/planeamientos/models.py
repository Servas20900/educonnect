from django.db import models
from django.conf import settings

class Planeamiento(models.Model):

    ESTADOS = (
        ("Borrador", "Borrador"),
        ("En revisión", "En revisión"),
        ("Aprobado", "Aprobado"),
    )

    docente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="planeamientos"
    )

    titulo = models.CharField(max_length=150)
    detalle = models.TextField(blank=True, default="")
    estado = models.CharField(max_length=20, choices=ESTADOS, default="Borrador")
    archivo = models.FileField(upload_to="planeamientos/", null=True, blank=True)
    fecha_envio = models.DateField(null=True, blank=True)
    comentarios = models.IntegerField(default=0)
    comentario_revision = models.TextField(blank=True, default="")
    fecha_revision = models.DateTimeField(null=True, blank=True)
    revisado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="planeamientos_revisados",
    )

    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.titulo