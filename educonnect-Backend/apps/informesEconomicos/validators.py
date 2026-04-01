import os
from django.core.exceptions import ValidationError

def validar_extension_archivo(value):
    ext = os.path.splitext(value.name)[1]
    valid_extensions = ['.pdf', '.xlsx', '.xls']
    if not ext.lower() in valid_extensions:
        raise ValidationError('Formato inválido. Solo se permiten archivos PDF o Excel.')