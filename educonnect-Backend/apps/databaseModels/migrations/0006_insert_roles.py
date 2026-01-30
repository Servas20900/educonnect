from django.db import migrations
from django.utils import timezone

def create_roles(apps, schema_editor):
    AuthRol = apps.get_model('databaseModels', 'AuthRol')
    
    roles_data = [
        {
            'nombre': 'administrador',
            'descripcion': 'Administrador del sistema con acceso total',
            'tipo_rol': 'sistema'
        },
        {
            'nombre': 'docente',
            'descripcion': 'Docente de la institución educativa',
            'tipo_rol': 'academico'
        },
        {
            'nombre': 'estudiante',
            'descripcion': 'Estudiante de la institución educativa',
            'tipo_rol': 'academico'
        },
        {
            'nombre': 'comite',
            'descripcion': 'Miembro de comité institucional',
            'tipo_rol': 'administrativo'
        },
        {
            'nombre': 'auxiliar',
            'descripcion': 'Auxiliar administrativo',
            'tipo_rol': 'administrativo'
        },
    ]
    
    for role_data in roles_data:
        AuthRol.objects.get_or_create(
            nombre=role_data['nombre'],
            defaults={
                'descripcion': role_data['descripcion'],
                'tipo_rol': role_data['tipo_rol'],
                'activo': True,
                'fecha_creacion': timezone.now(),
                'fecha_modificacion': timezone.now()
            }
        )

def delete_roles(apps, schema_editor):
    AuthRol = apps.get_model('databaseModels', 'AuthRol')
    AuthRol.objects.filter(nombre__in=['administrador', 'docente', 'estudiante', 'comite', 'auxiliar']).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('databaseModels', '0005_auto_auditoria'),
    ]

    operations = [
        migrations.RunPython(create_roles, delete_roles),
    ]
