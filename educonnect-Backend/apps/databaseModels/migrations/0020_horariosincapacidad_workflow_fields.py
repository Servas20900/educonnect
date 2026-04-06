from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('databaseModels', '0019_merge_20260405_2330'),
    ]

    operations = [
        migrations.AddField(
            model_name='horariosincapacidad',
            name='comentario_revision',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='horariosincapacidad',
            name='estado',
            field=models.CharField(default='pendiente', max_length=20),
        ),
        migrations.AddField(
            model_name='horariosincapacidad',
            name='fecha_revision',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='horariosincapacidad',
            name='revisada_por',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='horariosincapacidad_revisada_por_set', to='databaseModels.authusuario'),
        ),
        migrations.AddField(
            model_name='horariosincapacidad',
            name='tipo',
            field=models.CharField(default='incapacidad', max_length=30),
        ),
    ]
