from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('informesEconomicos', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='patronatoinforme',
            name='categoria',
            field=models.CharField(default='economico', max_length=30),
        ),
    ]
