from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Count
from django.utils import timezone
from datetime import datetime
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError
import re

from apps.databaseModels.models import (
    PersonasDocente,
    PersonasEstudiante,
    PersonasPersona,
    AuthUsuario,
    AuthUsuarioRol,
    AuthRol,
    AcademicoGrado,
    AcademicoGrupo,
    AcademicoMatricula,
)

from .serializers import (
    DocenteSerializer,
    EstudianteSerializer,
    GradoSerializer,
    GrupoSerializer,
)


def _generar_codigo_empleado():
    """Genera código único para docente: DOC-XXXX"""
    persona_id = PersonasDocente.objects.all().count() + 1
    return f"DOC-{persona_id:04d}"


def _generar_codigo_estudiante():
    """Genera código único para estudiante: EST-XXXX"""
    estudiante_count = PersonasEstudiante.objects.all().count() + 1
    return f"EST-{estudiante_count:04d}"


def _generar_codigo_grupo_desde_nombre(nombre):
    """Genera código único de grupo usando su nombre como base."""
    base = re.sub(r'\s+', '-', (nombre or '').strip().upper())
    base = re.sub(r'[^A-Z0-9\-]', '', base) or 'GRUPO'

    candidato = base
    contador = 1
    while AcademicoGrupo.objects.filter(codigo_grupo=candidato).exists():
        contador += 1
        candidato = f"{base}-{contador}"

    return candidato


def _asegurar_docente_por_persona_id(persona_id):
    """
    Si existe un usuario con rol docente pero sin PersonasDocente,
    crea el registro de PersonasDocente.
    Retorna: PersonasDocente instance o None
    """
    try:
        persona = PersonasPersona.objects.get(id=persona_id)
    except PersonasPersona.DoesNotExist:
        return None

    # Verificar si ya existe PersonasDocente
    try:
        return PersonasDocente.objects.get(persona_id=persona_id)
    except PersonasDocente.DoesNotExist:
        pass

    # Verificar si el usuario tiene rol docente
    usuario = getattr(persona, 'authUsuario', None)
    if not usuario:
        # Intentar obtener usuario asociado
        try:
            usuario = AuthUsuario.objects.get(persona=persona)
        except AuthUsuario.DoesNotExist:
            return None

    tiene_rol_docente = AuthUsuarioRol.objects.filter(
        usuario=usuario,
        rol__nombre__icontains='docente'
    ).exists()

    if not tiene_rol_docente:
        return None

    # Crear PersonasDocente
    docente = PersonasDocente.objects.create(
        persona=persona,
        codigo_empleado=_generar_codigo_empleado(),
        especialidad='',
        nivel_academico='',
        fecha_ingreso=timezone.now().date(),
        estado_laboral='activo',
        tipo_contrato='',
        horas_contratadas=0,
        numero_cuenta_bancaria='',
        titulo_profesional='',
        universidad='',
    )
    return docente


def _asegurar_estudiante_por_persona_id(persona_id):
    """
    Si existe un usuario con rol estudiante pero sin PersonasEstudiante,
    crea el registro de PersonasEstudiante.
    Retorna: PersonasEstudiante instance o None
    """
    try:
        persona = PersonasPersona.objects.get(id=persona_id)
    except PersonasPersona.DoesNotExist:
        return None

    try:
        return PersonasEstudiante.objects.get(persona_id=persona_id)
    except PersonasEstudiante.DoesNotExist:
        pass

    try:
        usuario = AuthUsuario.objects.get(persona=persona)
    except AuthUsuario.DoesNotExist:
        return None

    tiene_rol_estudiante = AuthUsuarioRol.objects.filter(
        usuario=usuario,
        rol__nombre__icontains='estudiante'
    ).exists()

    if not tiene_rol_estudiante:
        return None

    estudiante = PersonasEstudiante.objects.create(
        persona=persona,
        codigo_estudiante=_generar_codigo_estudiante(),
        fecha_ingreso=timezone.now().date(),
        estado_estudiante='activo',
        tipo_estudiante='regular',
        condicion_especial='',
        beca=False,
        tipo_beca='',
        porcentaje_beca=0,
        tiene_adecuacion=False,
        tipo_adecuacion='',
    )
    return estudiante


class ViewDocentes(viewsets.ModelViewSet):
    """ViewSet para gestionar Docentes"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocenteSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'persona__nombre',
        'persona__primer_apellido',
        'persona__segundo_apellido',
        'persona__identificacion',
        'codigo_empleado',
        'especialidad',
    ]
    ordering_fields = ['persona__nombre', 'codigo_empleado', 'fecha_ingreso']
    ordering = ['persona__primer_apellido', 'persona__nombre']

    def _verificar_admin(self):
        """Verifica si el usuario es administrador"""
        if self.request.user.is_superuser:
            return True
        rol = AuthUsuarioRol.objects.filter(
            usuario=self.request.user,
            rol__nombre__icontains='admin'
        ).exists()
        return rol

    def get_queryset(self):
        if not self._verificar_admin():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permisos para consultar docentes.')
        
        return PersonasDocente.objects.select_related('persona').filter(
            persona__activo=True
        )

    def partial_update(self, request, *args, **kwargs):
        if not self._verificar_admin():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permisos para editar docentes.')

        instance = self.get_object()
        persona = instance.persona

        # Campos de persona editables desde el módulo.
        persona_fields = [
            'nombre', 'primer_apellido', 'segundo_apellido',
            'identificacion', 'email_personal', 'email_institucional',
            'telefono_principal', 'telefono_secundario'
        ]
        for field in persona_fields:
            if field in request.data:
                setattr(persona, field, request.data.get(field))
        persona.fecha_modificacion = timezone.now()
        persona.save()

        # Campos propios del docente.
        docente_fields = [
            'especialidad', 'nivel_academico', 'estado_laboral', 'tipo_contrato',
            'horas_contratadas', 'salario_base', 'numero_cuenta_bancaria',
            'titulo_profesional', 'universidad', 'año_graduacion'
        ]
        for field in docente_fields:
            if field in request.data:
                setattr(instance, field, request.data.get(field))
        instance.save()

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        if not self._verificar_admin():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permisos para archivar docentes.')

        instance = self.get_object()
        persona = instance.persona

        # Archivado lógico.
        persona.activo = False
        persona.fecha_modificacion = timezone.now()
        persona.save()

        instance.estado_laboral = 'inactivo'
        if not instance.fecha_salida:
            instance.fecha_salida = timezone.now().date()
        instance.save()

        # Desactivar usuario asociado si existe.
        AuthUsuario.objects.filter(persona=persona).update(is_active=False)

        return Response({'mensaje': 'Docente archivado correctamente.'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def catalogo(self, request):
        """
        Retorna lista de docentes activos con información mínima.
        Útil para selectores y desplegables.
        """
        if not self._verificar_admin():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permisos.')

        # Obtener usuarios con rol docente
        usuarios_docentes = AuthUsuarioRol.objects.filter(
            rol__nombre__icontains='docente',
            usuario__is_active=True
        ).select_related('usuario', 'usuario__persona').values_list(
            'usuario__persona_id', flat=True
        ).distinct()

        docentes = []
        for persona_id in usuarios_docentes:
            docente = _asegurar_docente_por_persona_id(persona_id)
            if docente and docente.persona.activo:
                docentes.append({
                    'id': docente.persona_id,
                    'codigo_empleado': docente.codigo_empleado,
                    'nombre': docente.persona.nombre,
                    'primer_apellido': docente.persona.primer_apellido,
                    'segundo_apellido': docente.persona.segundo_apellido,
                    'identificacion': docente.persona.identificacion,
                    'email_institucional': docente.persona.email_institucional,
                    'especialidad': docente.especialidad,
                })

        return Response(docentes)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def crear_desde_usuario(self, request):
        """
        Crea un PersonasDocente a partir de un usuario que tiene rol docente.
        Esperado: { "usuario_id": <id> }
        """
        if not self._verificar_admin():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permisos.')

        usuario_id = request.data.get('usuario_id')
        if not usuario_id:
            return Response(
                {'error': 'usuario_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            usuario = AuthUsuario.objects.get(id=usuario_id)
        except AuthUsuario.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not usuario.persona:
            return Response(
                {'error': 'Usuario no tiene persona asociada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        docente = _asegurar_docente_por_persona_id(usuario.persona_id)
        if not docente:
            return Response(
                {'error': 'No se pudo crear docente. Verifica que el usuario tenga rol docente.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(docente)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ViewEstudiantes(viewsets.ModelViewSet):
    """ViewSet para gestionar Estudiantes"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EstudianteSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'persona__nombre',
        'persona__primer_apellido',
        'persona__segundo_apellido',
        'persona__identificacion',
        'codigo_estudiante',
    ]
    ordering_fields = ['persona__nombre', 'codigo_estudiante', 'fecha_ingreso']
    ordering = ['persona__primer_apellido', 'persona__nombre']

    def _verificar_admin(self):
        """Verifica si el usuario es administrador"""
        if self.request.user.is_superuser:
            return True
        rol = AuthUsuarioRol.objects.filter(
            usuario=self.request.user,
            rol__nombre__icontains='admin'
        ).exists()
        return rol

    def get_queryset(self):
        if not self._verificar_admin():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permisos para consultar estudiantes.')

        # Auto-materializa estudiantes que existen por rol pero no en personas_estudiante.
        personas_estudiantes = AuthUsuarioRol.objects.filter(
            rol__nombre__icontains='estudiante',
            usuario__is_active=True,
            usuario__persona__activo=True,
        ).values_list('usuario__persona_id', flat=True).distinct()

        for persona_id in personas_estudiantes:
            _asegurar_estudiante_por_persona_id(persona_id)
        
        return PersonasEstudiante.objects.select_related('persona').filter(
            persona__activo=True
        )

    def partial_update(self, request, *args, **kwargs):
        if not self._verificar_admin():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permisos para editar estudiantes.')

        instance = self.get_object()
        persona = instance.persona

        persona_fields = [
            'nombre', 'primer_apellido', 'segundo_apellido',
            'identificacion', 'email_personal', 'email_institucional',
            'telefono_principal', 'telefono_secundario'
        ]
        for field in persona_fields:
            if field in request.data:
                setattr(persona, field, request.data.get(field))
        persona.fecha_modificacion = timezone.now()
        persona.save()

        estudiante_fields = [
            'estado_estudiante', 'tipo_estudiante', 'condicion_especial',
            'beca', 'tipo_beca', 'porcentaje_beca', 'tiene_adecuacion', 'tipo_adecuacion'
        ]
        for field in estudiante_fields:
            if field in request.data:
                setattr(instance, field, request.data.get(field))
        instance.save()

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        if not self._verificar_admin():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permisos para archivar estudiantes.')

        instance = self.get_object()
        persona = instance.persona

        persona.activo = False
        persona.fecha_modificacion = timezone.now()
        persona.save()

        instance.estado_estudiante = 'inactivo'
        if not instance.fecha_retiro:
            instance.fecha_retiro = timezone.now().date()
        instance.save()

        AuthUsuario.objects.filter(persona=persona).update(is_active=False)

        return Response({'mensaje': 'Estudiante archivado correctamente.'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def por_grupo(self, request):
        """
        Lista estudiantes de un grupo específico.
        Query params: grupo_id (required)
        """
        grupo_id = request.query_params.get('grupo_id')
        if not grupo_id:
            return Response(
                {'error': 'grupo_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not self._verificar_admin():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permisos.')

        try:
            matriculas = AcademicoMatricula.objects.filter(
                grupo_id=grupo_id,
                estado='activo'
            ).select_related('estudiante', 'estudiante__persona')

            estudiantes = [m.estudiante for m in matriculas]
            serializer = self.get_serializer(estudiantes, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class ViewGrados(viewsets.ReadOnlyModelViewSet):
    """ViewSet para listar Grados (solo lectura)"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = GradoSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['numero_grado', 'nombre']
    ordering = ['numero_grado', 'nombre']

    def get_queryset(self):
        return AcademicoGrado.objects.filter(activo=True).order_by('numero_grado')

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def activos(self, request):
        """Retorna solo los grados activos"""
        grados = AcademicoGrado.objects.filter(activo=True).order_by('numero_grado')
        serializer = self.get_serializer(grados, many=True)
        return Response(serializer.data)


class ViewGrupos(viewsets.ModelViewSet):
    """ViewSet para gestionar Grupos Académicos"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = GrupoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'codigo_grupo', 'grado__nombre']
    ordering_fields = ['nombre', 'codigo_grupo', 'grado__numero_grado']
    ordering = ['grado__numero_grado', 'nombre']

    def _verificar_admin(self):
        """Verifica si el usuario es administrador"""
        if self.request.user.is_superuser:
            return True
        rol = AuthUsuarioRol.objects.filter(
            usuario=self.request.user,
            rol__nombre__icontains='admin'
        ).exists()
        return rol

    def get_queryset(self):
        return AcademicoGrupo.objects.select_related(
            'grado', 'docente_guia', 'docente_guia__persona'
        ).filter(
            grado__activo=True
        ).order_by('grado__numero_grado', 'nombre')

    def create(self, request, *args, **kwargs):
        if not self._verificar_admin():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permisos para crear grupos.')

        nombre = str(request.data.get('nombre', '')).strip()
        if not nombre:
            return Response({'error': 'El nombre del grupo es requerido.'}, status=status.HTTP_400_BAD_REQUEST)

        grado_id = request.data.get('grado')
        if not grado_id:
            return Response({'error': 'El grado es requerido.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            grado = AcademicoGrado.objects.get(id=grado_id, activo=True)
        except AcademicoGrado.DoesNotExist:
            return Response({'error': 'El grado seleccionado no existe o está inactivo.'}, status=status.HTTP_400_BAD_REQUEST)

        docente_persona_id = request.data.get('docente_guia')
        docente_obj = None
        if docente_persona_id:
            docente_obj = _asegurar_docente_por_persona_id(docente_persona_id)
            if not docente_obj:
                return Response({'error': 'Docente guía inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        now_dt = timezone.now()
        codigo_generado = _generar_codigo_grupo_desde_nombre(nombre)

        payload = {
            'grado': grado.id,
            'docente_guia': docente_obj.persona_id if docente_obj else None,
            'nombre': nombre,
            'codigo_grupo': codigo_generado,
            'aula': str(request.data.get('aula', '') or ''),
            'estado': 'activo',
            'fecha_creacion': now_dt,
            'fecha_modificacion': now_dt,
            'periodo': request.data.get('periodo') or None,
            'seccion': request.data.get('seccion') or None,
        }

        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def estudiantes(self, request, pk=None):
        """Lista estudiantes de un grupo específico"""
        try:
            matriculas = AcademicoMatricula.objects.filter(
                grupo_id=pk,
                estado='activo'
            ).select_related('estudiante', 'estudiante__persona')

            estudiantes = [m.estudiante for m in matriculas]
            serializer = EstudianteSerializer(estudiantes, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def asignar_estudiante(self, request, pk=None):
        """
        Asigna un estudiante a un grupo.
        Esperado: { "estudiante_id": <id> }
        """
        if not self._verificar_admin():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permisos.')

        estudiante_id = request.data.get('estudiante_id')
        if not estudiante_id:
            return Response(
                {'error': 'estudiante_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            grupo = AcademicoGrupo.objects.get(id=pk)
            estudiante = PersonasEstudiante.objects.get(persona_id=estudiante_id)

            # Crear matrícula
            matricula, created = AcademicoMatricula.objects.update_or_create(
                estudiante=estudiante,
                grupo=grupo,
                defaults={
                    'fecha_matricula': timezone.now().date(),
                    'estado': 'activo'
                }
            )

            return Response(
                {'mensaje': 'Estudiante asignado correctamente', 'creado': created},
                status=status.HTTP_200_OK
            )
        except AcademicoGrupo.DoesNotExist:
            return Response(
                {'error': 'Grupo no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except PersonasEstudiante.DoesNotExist:
            return Response(
                {'error': 'Estudiante no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def remover_estudiante(self, request, pk=None):
        """
        Remueve un estudiante de un grupo (marca como retirado).
        Esperado: { "estudiante_id": <id> }
        """
        if not self._verificar_admin():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permisos.')

        estudiante_id = request.data.get('estudiante_id')
        if not estudiante_id:
            return Response(
                {'error': 'estudiante_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            estudiante = PersonasEstudiante.objects.get(persona_id=estudiante_id)
            matriculas = AcademicoMatricula.objects.filter(
                estudiante=estudiante,
                grupo_id=pk,
                estado='activo'
            )

            for matricula in matriculas:
                matricula.estado = 'retirado'
                matricula.fecha_retiro = timezone.now().date()
                matricula.save()

            return Response(
                {'mensaje': 'Estudiante removido del grupo'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def por_grado(self, request):
        """
        Retorna grupos organizados por grado.
        Estructura: { "grado_id": <id>, "grado_nombre": "", "grupos": [...] }
        """
        grados = AcademicoGrado.objects.filter(activo=True).order_by('numero_grado')
        result = []

        for grado in grados:
            grupos = AcademicoGrupo.objects.filter(
                grado=grado
            ).select_related('docente_guia', 'docente_guia__persona')

            grupos_serializados = GrupoSerializer(grupos, many=True).data

            result.append({
                'grado_id': grado.id,
                'grado_nombre': grado.nombre,
                'numero_grado': grado.numero_grado,
                'grupos': grupos_serializados,
            })

        return Response(result)
