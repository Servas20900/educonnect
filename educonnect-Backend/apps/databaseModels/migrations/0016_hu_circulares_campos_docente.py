from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('databaseModels', '0015_alter_comitesreunion_unique_together_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='comunicacionescircular',
            name='detalle',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='comunicacionescircular',
            name='destinatarios',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='comunicacionescircular',
            name='tipo_comunicado',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='comunicacionescircular',
            name='visible',
            field=models.BooleanField(default=True),
        ),
    ]
