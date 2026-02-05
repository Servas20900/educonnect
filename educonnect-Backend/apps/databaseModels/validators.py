import os
from django.core.exceptions import ValidationError

def validar_extension_archivo(value):
    ext = os.path.splitext(value.name)[1].lower()
    valid_extensions = ['.pdf', '.docx', '.jpg', '.png', '.jpeg'] #Si hay que agregar otro tipo de archivo se cambia de aca
    if not ext in valid_extensions:
        raise ValidationError('Tipo de archivo no soportado. Solo se permiten: PDF, DOCX e Imágenes.')