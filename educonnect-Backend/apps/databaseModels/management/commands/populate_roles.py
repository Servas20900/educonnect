from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.databaseModels.models import AuthRol, AuthPermiso, AuthRolPermiso

class Command(BaseCommand):
    help = 'Inserta los roles y permisos iniciales del sistema'

    def handle(self, *args, **options):
        self.stdout.write("Iniciando inserción de roles y permisos...")
        
        # Definir módulos y acciones disponibles
        modulos = ['admin', 'docente', 'estudiante', 'comite', 'auxiliares']
        acciones = ['create', 'read', 'update', 'delete']
        
        # Crear permisos para todos los módulos
        permisos_creados = {}
        for modulo in modulos:
            for accion in acciones:
                nombre_permiso = f"{modulo}_{accion}"
                descripcion = f"Permiso para {accion} en módulo {modulo}"
                
                permiso, created = AuthPermiso.objects.get_or_create(
                    nombre=nombre_permiso,
                    defaults={
                        'descripcion': descripcion,
                        'modulo': modulo,
                        'accion': accion,
                        'activo': True,
                        'fecha_creacion': timezone.now()
                    }
                )
                permisos_creados[nombre_permiso] = permiso
                if created:
                    self.stdout.write(self.style.SUCCESS(f"✓ Permiso creado: {nombre_permiso}"))
        
        # Definir roles del sistema
        roles_config = {
            'administrador': {
                'descripcion': 'Administrador del sistema con acceso total',
                'tipo_rol': 'admin',
                'permisos': ['admin_create', 'admin_read', 'admin_update', 'admin_delete',
                            'docente_read', 'docente_update',
                            'estudiante_read',
                            'comite_create', 'comite_read', 'comite_update', 'comite_delete',
                            'auxiliares_read', 'auxiliares_update']
            },
            'docente': {
                'descripcion': 'Rol para docentes con acceso a módulo docente',
                'tipo_rol': 'docente',
                'permisos': ['docente_create', 'docente_read', 'docente_update',
                            'comite_read', 'comite_create', 'comite_update',
                            'estudiante_read',
                            'auxiliares_read']
            },
            'estudiante': {
                'descripcion': 'Rol para estudiantes con acceso limitado',
                'tipo_rol': 'estudiante',
                'permisos': ['estudiante_read',
                            'auxiliares_read']
            },
            'comite': {
                'descripcion': 'Rol para miembros de comités',
                'tipo_rol': 'comite',
                'permisos': ['comite_create', 'comite_read', 'comite_update', 'comite_delete',
                            'docente_read',
                            'estudiante_read',
                            'auxiliares_read']
            },
            'auxiliares': {
                'descripcion': 'Rol para órganos auxiliares',
                'tipo_rol': 'auxiliares',
                'permisos': ['auxiliares_create', 'auxiliares_read', 'auxiliares_update',
                            'docente_read',
                            'estudiante_read']
            }
        }
        
        # Crear roles y asignar permisos
        for rol_nombre, rol_config in roles_config.items():
            rol, created = AuthRol.objects.get_or_create(
                nombre=rol_nombre,
                defaults={
                    'descripcion': rol_config['descripcion'],
                    'tipo_rol': rol_config['tipo_rol'],
                    'activo': True,
                    'fecha_creacion': timezone.now(),
                    'fecha_modificacion': timezone.now()
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f"✓ Rol creado: {rol_nombre}"))
            else:
                self.stdout.write(self.style.WARNING(f"⚠ Rol ya existe: {rol_nombre}"))
            
            # Asignar permisos al rol
            for permiso_nombre in rol_config['permisos']:
                if permiso_nombre in permisos_creados:
                    permiso = permisos_creados[permiso_nombre]
                    rol_permiso, created = AuthRolPermiso.objects.get_or_create(
                        rol=rol,
                        permiso=permiso,
                        defaults={
                            'fecha_asignacion': timezone.now()
                        }
                    )
                    if created:
                        self.stdout.write(f"  → Permiso asignado: {permiso_nombre}")
        
        self.stdout.write(self.style.SUCCESS("\n✓ Roles y permisos insertados exitosamente"))
