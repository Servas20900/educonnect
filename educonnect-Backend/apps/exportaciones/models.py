from django.db import models
from django.conf import settings

class Exportacion(models.Model):
    FORMATOS = (
        ("PDF", "PDF"),
        ("CSV", "CSV"),
        ("XLSX", "XLSX"),
    )

    docente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="exportaciones"
    )

    nombre = models.CharField(max_length=150)
    formato = models.CharField(max_length=10, choices=FORMATOS, default="PDF")
    archivo = models.FileField(upload_to="exportaciones/", null=True, blank=True)

    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nombre