from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import BackupsArchivo
from .serializers import BackupSerializer
from .services import create_db_backup


class BackupCreateView(APIView):

    def post(self, request):
        try:
            backup = create_db_backup(user=request.user)
            serializer = BackupSerializer(backup)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BackupListView(APIView):

    def get(self, request):
        backups = BackupsArchivo.objects.all().order_by("-creado_en")
        serializer = BackupSerializer(backups, many=True)
        return Response(serializer.data)