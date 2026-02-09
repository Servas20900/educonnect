from django.db import models
from django.conf import settings

TIPO_BACKUP_CHOICES = (
	("db", "db"),
	("media", "media"),
	("full", "full"),
)

ESTADO_CHOICES = (
	("completed", "completed"),
	("pending", "pending"),
	("failed", "failed"),
)

class BackupsArchivo(models.Model):
	id = models.BigAutoField(primary_key=True)
	nombre_archivo = models.CharField(max_length=255)
	# Guardamos la URL (Cloudinary) o ruta/filepath en este campo.
	ruta = models.CharField(max_length=500, blank=True, null=True)
	# Referencia al usuario que creó el backup
	creado_por = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		models.SET_NULL,
		blank=True,
		null=True,
	)
	creado_en = models.DateTimeField(auto_now_add=True)
	tipo = models.CharField(max_length=20, choices=TIPO_BACKUP_CHOICES)
	tamano_bytes = models.BigIntegerField(blank=True, null=True)
	estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default="pending")
	notas = models.TextField(blank=True, null=True)

	class Meta:
		managed = True
		db_table = "backups_archivo"

	def __str__(self):
		return f"{self.nombre_archivo} ({self.tipo})"

