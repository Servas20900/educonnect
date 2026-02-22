from rest_framework import serializers
from .models import BackupsArchivo


class BackupSerializer(serializers.ModelSerializer):
    class Meta:
        model = BackupsArchivo
        fields = "__all__"