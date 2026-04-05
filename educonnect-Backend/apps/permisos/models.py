from django.db import models


class ConfiguracionSistema(models.Model):
	"""Configuración funcional del frontend persistida en DB."""

	clave = models.CharField(max_length=100, unique=True)
	descripcion = models.TextField(blank=True)
	valor = models.JSONField(default=dict, blank=True)
	activo = models.BooleanField(default=True)
	fecha_creacion = models.DateTimeField(auto_now_add=True)
	fecha_modificacion = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = 'permisos_configuracion_sistema'
		verbose_name = 'Configuracion del sistema'
		verbose_name_plural = 'Configuraciones del sistema'

	def __str__(self):
		return self.clave
