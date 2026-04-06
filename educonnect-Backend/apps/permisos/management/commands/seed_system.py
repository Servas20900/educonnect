import os

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.databaseModels.models import (
    AuthPermiso,
    AuthRol,
    AuthRolPermiso,
    AuthUsuario,
    AuthUsuarioRol,
    AcademicoGrado,
)
from apps.permisos.defaults import (
    DEFAULT_ACTIONS,
    DEFAULT_CONFIGURATION_MAP,
    DEFAULT_MODULES,
    DEFAULT_ROLE_CONFIG,
)
from apps.permisos.models import ConfiguracionSistema


class Command(BaseCommand):
    help = 'Seed idempotente para roles, permisos y configuracion de frontend en DB.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-admin',
            action='store_true',
            help='No crea/actualiza el usuario administrador de desarrollo.',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Iniciando seed del sistema...'))

        permisos_map = self._seed_permisos()
        roles_map = self._seed_roles_y_permisos(permisos_map)
        self._seed_configuracion_sistema()
        self._seed_grados()

        if not options.get('skip_admin'):
            self._seed_admin(roles_map)

        self.stdout.write(self.style.SUCCESS('Seed del sistema completado correctamente.'))

    def _seed_permisos(self):
        permisos_map = {}
        now = timezone.now()

        for modulo in DEFAULT_MODULES:
            for accion in DEFAULT_ACTIONS:
                nombre_permiso = f'{modulo}_{accion}'
                permiso, _ = AuthPermiso.objects.update_or_create(
                    nombre=nombre_permiso,
                    defaults={
                        'descripcion': f'Permiso para {accion} en modulo {modulo}',
                        'modulo': modulo,
                        'accion': accion,
                        'activo': True,
                        'fecha_creacion': now,
                    },
                )
                permisos_map[nombre_permiso] = permiso

        self.stdout.write(self.style.SUCCESS(f'Permisos listos: {len(permisos_map)}'))
        return permisos_map

    def _seed_roles_y_permisos(self, permisos_map):
        roles_map = {}
        now = timezone.now()

        for rol_nombre, role_config in DEFAULT_ROLE_CONFIG.items():
            rol, _ = AuthRol.objects.update_or_create(
                nombre=rol_nombre,
                defaults={
                    'descripcion': role_config['descripcion'],
                    'tipo_rol': role_config['tipo_rol'],
                    'activo': True,
                    'fecha_creacion': now,
                    'fecha_modificacion': now,
                },
            )
            roles_map[rol_nombre] = rol

            AuthRolPermiso.objects.filter(rol=rol).delete()

            asignaciones = []
            for permiso_nombre in role_config['permisos']:
                permiso = permisos_map.get(permiso_nombre)
                if permiso:
                    asignaciones.append(
                        AuthRolPermiso(
                            rol=rol,
                            permiso=permiso,
                            fecha_asignacion=now,
                        )
                    )

            AuthRolPermiso.objects.bulk_create(asignaciones, ignore_conflicts=True)

        self.stdout.write(self.style.SUCCESS(f'Roles listos: {len(roles_map)}'))
        return roles_map

    def _seed_configuracion_sistema(self):
        for clave, config in DEFAULT_CONFIGURATION_MAP.items():
            ConfiguracionSistema.objects.update_or_create(
                clave=clave,
                defaults={
                    'descripcion': config['descripcion'],
                    'valor': config['valor'],
                    'activo': True,
                },
            )

        self.stdout.write(self.style.SUCCESS('Configuracion funcional en DB actualizada.'))

    def _seed_grados(self):
        grados_base = [
            ('Primero', 'primaria', 1),
            ('Segundo', 'primaria', 2),
            ('Tercero', 'primaria', 3),
            ('Cuarto', 'primaria', 4),
            ('Quinto', 'primaria', 5),
            ('Sexto', 'primaria', 6),
        ]

        for nombre, nivel, numero_grado in grados_base:
            AcademicoGrado.objects.update_or_create(
                nivel=nivel,
                numero_grado=numero_grado,
                defaults={
                    'nombre': nombre,
                    'descripcion': f'Grado {nombre.lower()} de primaria',
                    'activo': True,
                },
            )

        self.stdout.write(self.style.SUCCESS('Grados académicos base listos.'))

    def _seed_admin(self, roles_map):
        admin_username = os.getenv('SEED_ADMIN_USER', 'admin')
        admin_email = os.getenv('SEED_ADMIN_EMAIL', 'admin@test.com')
        admin_password = os.getenv('SEED_ADMIN_PASSWORD', 'admin123')

        admin_user = AuthUsuario.objects.filter(username=admin_username).first()
        if not admin_user:
            admin_user = AuthUsuario.objects.create_superuser(
                username=admin_username,
                email=admin_email,
                password=admin_password,
            )
            self.stdout.write(self.style.SUCCESS(f'Usuario admin creado: {admin_username}'))
        else:
            if not admin_user.is_superuser:
                admin_user.is_superuser = True
                admin_user.is_staff = True
                admin_user.save(update_fields=['is_superuser', 'is_staff'])
            self.stdout.write(self.style.NOTICE(f'Usuario admin existente: {admin_username}'))

        admin_role = roles_map.get('administrador')
        if admin_role:
            AuthUsuarioRol.objects.get_or_create(
                usuario=admin_user,
                rol=admin_role,
                defaults={'fecha_asignacion': timezone.now()},
            )
