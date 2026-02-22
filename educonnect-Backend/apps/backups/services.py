import os
import subprocess
from datetime import datetime
from .models import BackupsArchivo


def create_db_backup(user=None):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"backup_{timestamp}.dump"
    backup_path = f"/app/backups/{filename}"

    os.environ["PGPASSWORD"] = os.getenv("POSTGRES_PASSWORD")

    command = [
        "pg_dump",
        "-h", "postgres",  # service name in docker-compose
        "-U", os.getenv("POSTGRES_USER"),
        "-d", os.getenv("POSTGRES_DB"),
        "-F", "c",
        "-f", backup_path
    ]

    try:
        subprocess.run(command, check=True)

        backup = BackupsArchivo.objects.create(
            nombre_archivo=filename,
            ruta=backup_path,
            tipo="db",
            estado="completed",
            creado_por=user,
            tamano_bytes=os.path.getsize(backup_path)
        )

        return backup

    except subprocess.CalledProcessError as e:
        backup = BackupsArchivo.objects.create(
            nombre_archivo=filename,
            ruta=backup_path,
            tipo="db",
            estado="failed",
            creado_por=user,
            notas=str(e)
        )
        raise e