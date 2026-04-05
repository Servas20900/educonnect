from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='ConfiguracionSistema',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('clave', models.CharField(max_length=100, unique=True)),
                ('descripcion', models.TextField(blank=True)),
                ('valor', models.JSONField(blank=True, default=dict)),
                ('activo', models.BooleanField(default=True)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('fecha_modificacion', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'permisos_configuracion_sistema',
                'verbose_name': 'Configuracion del sistema',
                'verbose_name_plural': 'Configuraciones del sistema',
            },
        ),
    ]
