from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('databaseModels', '0021_horariosincapacidad_fecha_creacion'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='comitesmiembro',
            unique_together={('comite', 'persona')},
        ),
    ]