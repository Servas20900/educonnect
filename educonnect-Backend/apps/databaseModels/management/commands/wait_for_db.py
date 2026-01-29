# core/management/commands/wait_for_db.py

import time
from django.db import connections
from django.db.utils import OperationalError
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    """Comando de Django el cual espera la BD"""

    def handle(self, *args, **options):
        self.stdout.write('Esperando por la base de datos...')
        db_conn = None
        while not db_conn:
            try:
                # Obtener la conexión por defecto
                db_conn = connections['default']
                # Intentar forzar una conexión para ver si levanta un error
                db_conn.ensure_connection()
            except OperationalError:
                self.stdout.write('La base de datos no está disponible, esperando 1 segundo...')
                time.sleep(1)

        self.stdout.write(self.style.SUCCESS('¡La base de datos está disponible!'))