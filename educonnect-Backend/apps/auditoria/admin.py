from django.contrib import admin
from databaseModels.models import AuthAuditoriaLog

@admin.register(AuthAuditoriaLog)
class AuthAuditoriaLogAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'accion', 'modulo', 'resultado', 'fecha_hora')
    list_filter = ('resultado', 'modulo', 'fecha_hora')
    search_fields = ('usuario__username', 'descripcion', 'modulo')
    readonly_fields = ('fecha_hora', 'ip_address')
