from django.db import models

class Plantilla(models.Model):
    ESTADOS = (
        ("Publicado", "Publicado"),
        ("Borrador", "Borrador"),
        ("Inactivo", "Inactivo"),
    )

    nombre = models.CharField(max_length=150)
    categoria = models.CharField(max_length=80, default="General")
    ultima_actualizacion = models.DateField(auto_now=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default="Borrador")

    archivo_adjunto = models.FileField(upload_to="plantillas/", null=True, blank=True)

    def __str__(self):
        return self.nombre