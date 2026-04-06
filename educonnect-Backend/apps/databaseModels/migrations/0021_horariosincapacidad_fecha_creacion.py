from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('databaseModels', '0020_horariosincapacidad_workflow_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='horariosincapacidad',
            name='fecha_creacion',
            field=models.DateField(auto_now_add=True, null=True),
        ),
        migrations.AlterField(
            model_name='horariosincapacidad',
            name='documento_adjunto',
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
        migrations.AlterField(
            model_name='horariosincapacidad',
            name='estado',
            field=models.CharField(default='aprobada', max_length=20),
        ),
    ]
