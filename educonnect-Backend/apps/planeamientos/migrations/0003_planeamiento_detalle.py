from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("planeamientos", "0002_planeamiento_revision_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="planeamiento",
            name="detalle",
            field=models.TextField(blank=True, default=""),
        ),
    ]
