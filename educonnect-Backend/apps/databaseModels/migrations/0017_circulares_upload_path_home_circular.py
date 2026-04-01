from django.db import migrations, models
import apps.databaseModels.validators


class Migration(migrations.Migration):

    dependencies = [
        ('databaseModels', '0016_hu_circulares_campos_docente'),
    ]

    operations = [
        migrations.AlterField(
            model_name='comunicacionescircular',
            name='archivo_adjunto',
            field=models.FileField(
                blank=True,
                null=True,
                upload_to='home/circular/',
                validators=[apps.databaseModels.validators.validar_extension_archivo],
            ),
        ),
    ]
