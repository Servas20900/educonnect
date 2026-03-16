from django.db import models
from django.conf import settings


class AsistenciaRegistro(models.Model):
    grupo = models.ForeignKey(
        'databaseModels.AcademicoGrupo',
        on_delete=models.CASCADE,
        related_name='asistencias_registro'
    )
    docente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='asistencias_registro'
    )
    fecha = models.DateField()
    cerrado = models.BooleanField(default=False)

    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('grupo', 'fecha')

    def __str__(self):
        return f"Asistencia {self.grupo_id} - {self.fecha}"


class AsistenciaDetalle(models.Model):
    ESTADOS = (
        ('presente', 'Presente'),
        ('ausente', 'Ausente'),
        ('tardia', 'Tardía'),
    )

    registro = models.ForeignKey(
        AsistenciaRegistro,
        on_delete=models.CASCADE,
        related_name='detalles'
    )
    estudiante = models.ForeignKey(
        'databaseModels.PersonasEstudiante',
        on_delete=models.CASCADE,
        related_name='asistencias_detalle'
    )
    estado = models.CharField(max_length=20, choices=ESTADOS, default='presente')
    justificada = models.BooleanField(default=False)
    justificante = models.FileField(upload_to='justificantes_asistencia/', null=True, blank=True)
    observacion = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('registro', 'estudiante')

    def __str__(self):
        return f"{self.estudiante_id} - {self.estado}"