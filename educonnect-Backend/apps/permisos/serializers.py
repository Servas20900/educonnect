from rest_framework import serializers
from apps.databaseModels.models import AuthUsuario, AuthRol, AuthPermiso, AuthUsuarioRol, AuthRolPermiso, PersonasPersona
from datetime import datetime

class PersonaSimpleSerializer(serializers.ModelSerializer):
    """Serializer simplificado para datos de persona"""
    nombre_completo = serializers.SerializerMethodField()
    
    class Meta:
        model = PersonasPersona
        fields = ['nombre', 'primer_apellido', 'segundo_apellido', 'nombre_completo']
    
    def get_nombre_completo(self, obj):
        return f"{obj.nombre} {obj.primer_apellido} {obj.segundo_apellido or ''}".strip()


class UsuarioListSerializer(serializers.ModelSerializer):
    """Serializer para listar usuarios con información básica"""
    persona = PersonaSimpleSerializer(read_only=True)
    rol = serializers.SerializerMethodField()
    
    class Meta:
        model = AuthUsuario
        fields = ['id', 'username', 'email', 'is_active', 'persona', 'rol', 'fecha_registro']
    
    def get_rol(self, obj):
        # Obtiene el primer rol del usuario (si tiene varios)
        usuario_rol = AuthUsuarioRol.objects.filter(usuario=obj).first()
        if usuario_rol and usuario_rol.rol:
            return {
                'id': usuario_rol.rol.id,
                'nombre': usuario_rol.rol.nombre,
                'tipo_rol': usuario_rol.rol.tipo_rol
            }
        return None


class UsuarioDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para ver/editar usuario"""
    persona = PersonaSimpleSerializer(read_only=True)
    roles = serializers.SerializerMethodField()
    
    class Meta:
        model = AuthUsuario
        fields = ['id', 'username', 'email', 'is_active', 'is_staff', 'persona', 'roles', 
                  'fecha_registro', 'fecha_ultimo_login', 'bloqueado', 'intentos_fallidos']
        read_only_fields = ['fecha_registro', 'fecha_ultimo_login']
    
    def get_roles(self, obj):
        roles_usuario = AuthUsuarioRol.objects.filter(usuario=obj).select_related('rol')
        return [{'id': ur.rol.id, 'nombre': ur.rol.nombre, 'tipo_rol': ur.rol.tipo_rol} 
                for ur in roles_usuario if ur.rol]


class UsuarioUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar usuario"""
    rol_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = AuthUsuario
        fields = ['email', 'is_active', 'bloqueado', 'rol_id']
    
    def update(self, instance, validated_data):
        rol_id = validated_data.pop('rol_id', None)
        
        # Actualizar campos básicos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Actualizar rol si se proporciona
        if rol_id is not None:
            AuthUsuarioRol.objects.filter(usuario=instance).delete()
            rol = AuthRol.objects.get(id=rol_id)
            AuthUsuarioRol.objects.create(
                usuario=instance,
                rol=rol,
                fecha_asignacion= datetime.now()
            )
        
        return instance


class RolSerializer(serializers.ModelSerializer):
    """Serializer para roles"""
    permisos = serializers.SerializerMethodField()
    modulos_permitidos = serializers.SerializerMethodField()
    
    class Meta:
        model = AuthRol
        fields = ['id', 'nombre', 'descripcion', 'tipo_rol', 'activo', 
                  'fecha_creacion', 'permisos', 'modulos_permitidos']
        read_only_fields = ['fecha_creacion']
    
    def get_permisos(self, obj):
        permisos_rol = AuthRolPermiso.objects.filter(rol=obj).select_related('permiso')
        return [{'id': rp.permiso.id, 'nombre': rp.permiso.nombre, 
                 'modulo': rp.permiso.modulo, 'accion': rp.permiso.accion} 
                for rp in permisos_rol if rp.permiso]
    
    def get_modulos_permitidos(self, obj):
        """Extrae los módulos únicos de los permisos"""
        permisos_rol = AuthRolPermiso.objects.filter(rol=obj).select_related('permiso')
        modulos = set(rp.permiso.modulo for rp in permisos_rol if rp.permiso)
        return list(modulos)


class RolUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar roles y sus permisos"""
    permisos_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = AuthRol
        fields = ['nombre', 'descripcion', 'tipo_rol', 'activo', 'permisos_ids']
    
    def create(self, validated_data):
        from django.utils import timezone
        permisos_ids = validated_data.pop('permisos_ids', [])
        validated_data['fecha_creacion'] = timezone.now()
        validated_data['fecha_modificacion'] = timezone.now()
        
        rol = AuthRol.objects.create(**validated_data)
        
        # Asignar permisos
        for permiso_id in permisos_ids:
            permiso = AuthPermiso.objects.get(id=permiso_id)
            AuthRolPermiso.objects.create(
                rol=rol,
                permiso=permiso,
                fecha_asignacion=timezone.now()
            )
        
        return rol
    
    def update(self, instance, validated_data):
        from django.utils import timezone
        permisos_ids = validated_data.pop('permisos_ids', None)
        
        # Actualizar campos básicos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.fecha_modificacion = timezone.now()
        instance.save()
        
        # Actualizar permisos si se proporciona la lista
        if permisos_ids is not None:
            AuthRolPermiso.objects.filter(rol=instance).delete()
            for permiso_id in permisos_ids:
                permiso = AuthPermiso.objects.get(id=permiso_id)
                AuthRolPermiso.objects.create(
                    rol=instance,
                    permiso=permiso,
                    fecha_asignacion=timezone.now()
                )
        
        return instance


class PermisoSerializer(serializers.ModelSerializer):
    """Serializer para permisos"""
    class Meta:
        model = AuthPermiso
        fields = ['id', 'nombre', 'descripcion', 'modulo', 'accion', 'activo', 'fecha_creacion']
        read_only_fields = ['fecha_creacion']


class ModuloSerializer(serializers.Serializer):
    """Serializer para definir módulos del sistema"""
    id = serializers.CharField()
    nombre = serializers.CharField()
    grupo = serializers.CharField()
    submodulos = serializers.ListField(child=serializers.CharField())
