from django.db import migrations, models
import django.utils.timezone


TIPOS_CHECK = "('informativo', 'urgente', 'evento', 'aviso', 'felicitacion', 'tarea', 'cambio')"
TIPOS_CHECK_OLD = "('informativo', 'urgente', 'evento', 'aviso', 'felicitacion')"


def actualizar_constraint_tipos(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        return

    schema_editor.execute(
        "ALTER TABLE comunicaciones_comunicado DROP CONSTRAINT IF EXISTS tipo_comunicado_valido;"
    )
    schema_editor.execute(
        f"ALTER TABLE comunicaciones_comunicado ADD CONSTRAINT tipo_comunicado_valido CHECK (tipo_comunicado IN {TIPOS_CHECK});"
    )


def revertir_constraint_tipos(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        return

    schema_editor.execute(
        "ALTER TABLE comunicaciones_comunicado DROP CONSTRAINT IF EXISTS tipo_comunicado_valido;"
    )
    schema_editor.execute(
        f"ALTER TABLE comunicaciones_comunicado ADD CONSTRAINT tipo_comunicado_valido CHECK (tipo_comunicado IN {TIPOS_CHECK_OLD});"
    )


class Migration(migrations.Migration):

    dependencies = [
        ('databaseModels', '0013_documentosdocumento_content_type_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='comunicacionescomunicado',
            name='destinatarios',
            field=models.JSONField(default=list),
        ),
        migrations.AlterField(
            model_name='comunicacionescomunicado',
            name='fecha_publicacion',
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AlterField(
            model_name='comunicacionescomunicado',
            name='tipo_comunicado',
            field=models.CharField(
                choices=[
                    ('informativo', 'Informativo'),
                    ('urgente', 'Urgente'),
                    ('evento', 'Evento'),
                    ('aviso', 'Aviso'),
                    ('felicitacion', 'Felicitación'),
                    ('tarea', 'Tarea'),
                    ('cambio', 'Cambio'),
                ],
                default='informativo',
                max_length=50,
            ),
        ),
        migrations.AlterField(
            model_name='comunicacionescomunicado',
            name='visible',
            field=models.BooleanField(default=True),
        ),
        migrations.RunPython(actualizar_constraint_tipos, reverse_code=revertir_constraint_tipos),
    ]
