from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("planeamientos", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="planeamiento",
            name="comentario_revision",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="planeamiento",
            name="fecha_revision",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="planeamiento",
            name="revisado_por",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="planeamientos_revisados",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
