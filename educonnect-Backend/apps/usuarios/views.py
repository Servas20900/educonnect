from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from core.permissions import IsAdmin, IsDocenteOrAdmin
from django.db.models import Q, Count
from django.utils import timezone
from datetime import datetime, date
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError
from django.db import transaction, IntegrityError
from django.contrib.auth.hashers import make_password
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
    """Genera código único para estudiante: EST-XXXXX (mismo formato/lógica que
    apps.usuarios.views._crear_estudiante_usuario, para no volver a generar
    códigos con padding inconsistente que colisionan entre sí)."""
    num = 0
    for codigo in PersonasEstudiante.objects.values_list('codigo_estudiante', flat=True):
        match = re.search(r'(\d+)$', str(codigo or ''))
        if match:
            num = max(num, int(match.group(1)))
    return f"EST-{num + 1:05d}"


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
    """ViewSet para gestionar Docentes — solo Admin."""
    permission_classes = [IsAdmin]
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

        queryset = PersonasDocente.objects.select_related('persona')

        # Por defecto solo activos (para selectores de docente_guia, etc.).
        # La pantalla de administración de Docentes pide ?incluir_archivados=true
        # para poder mostrar también los archivados y sus contadores.
        incluir_archivados = str(
            self.request.query_params.get('incluir_archivados', '')
        ).lower() in ('1', 'true', 'yes')

        if incluir_archivados:
            return queryset
        return queryset.filter(persona__activo=True)

    def partial_update(self, request, *args, **kwargs):
        if not self._verificar_admin():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permisos para editar docentes.')

        # Se busca directo (no via get_object/get_queryset) para poder editar
        # también docentes archivados sin depender de ?incluir_archivados=true.
        try:
            instance = PersonasDocente.objects.select_related('persona').get(pk=kwargs.get('pk'))
        except PersonasDocente.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('Docente no encontrado.')
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

        # Única fuente de verdad: sincroniza persona.activo, AuthUsuario.is_active
        # y estado_laboral en un solo lugar (core.utils.set_persona_active_state),
        # para que quede igual sin importar si luego se consulta desde Docentes
        # o desde Usuarios y Permisos.
        from core.utils import set_persona_active_state
        set_persona_active_state(instance.persona, False)

        return Response({'mensaje': 'Docente desactivado correctamente.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def reactivar(self, request, pk=None):
        """Revierte el archivado: reactiva persona, docente y usuario asociado."""
        if not self._verificar_admin():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permisos para reactivar docentes.')

        # Se busca directo (sin pasar por get_queryset/get_object) para que
        # funcione sin importar si el request trae ?incluir_archivados=true.
        try:
            instance = PersonasDocente.objects.select_related('persona').get(pk=pk)
        except PersonasDocente.DoesNotExist:
            return Response({'error': 'Docente no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        from core.utils import set_persona_active_state
        set_persona_active_state(instance.persona, True)
        instance.refresh_from_db()

        serializer = self.get_serializer(instance)
        return Response(
            {'mensaje': 'Docente activado correctamente.', 'data': serializer.data},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
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

    @action(detail=False, methods=['post'], permission_classes=[IsAdmin])
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


def _crear_estudiante_usuario(identificacion, nombre, primer_apellido, segundo_apellido='', email='', password=None):
    """Crea PersonasPersona + AuthUsuario + PersonasEstudiante y asigna rol estudiante."""
    if not email:
        email = f'{identificacion}@estudiante.local'
    if not password:
        password = identificacion

    with transaction.atomic():
        persona, _ = PersonasPersona.objects.get_or_create(
            identificacion=identificacion,
            defaults={
                'nombre': nombre,
                'primer_apellido': primer_apellido,
                'segundo_apellido': segundo_apellido,
                'fecha_nacimiento': date(2000, 1, 1),
                'genero': 'No especificado',
                'tipo_identificacion': 'cedula',
                'nacionalidad': 'costarricense',
                'telefono_principal': '00000000',
                'telefono_secundario': '',
                'email_personal': email,
                'email_institucional': email,
                'direccion_exacta': 'No especificada',
                'provincia': 'No especificada',
                'canton': 'No especificado',
                'distrito': 'No especificado',
                'estado_civil': 'No especificado',
                'notas': '',
            },
        )

        usuario, created = AuthUsuario.objects.get_or_create(
            persona=persona,
            defaults={
                'username': identificacion,
                'email': email,
                'password': make_password(password),
                'is_active': True,
            },
        )

        # No usar order_by('-codigo_estudiante') ni tomar solo el último: es un
        # ordenamiento de texto y códigos con distinto padding (p. ej. "EST-0081"
        # vs "EST-00082") lo rompen, generando colisiones con el unique constraint.
        # Se calcula el máximo numérico real recorriendo todos los códigos.
        num = 0
        for codigo in PersonasEstudiante.objects.values_list('codigo_estudiante', flat=True):
            match = re.search(r'(\d+)$', str(codigo or ''))
            if match:
                num = max(num, int(match.group(1)))
        num += 1

        est, _ = PersonasEstudiante.objects.get_or_create(
            persona=persona,
            defaults={
                'codigo_estudiante': f'EST-{num:05d}',
                'fecha_ingreso': date.today(),
                'estado_estudiante': 'activo',
                'tipo_estudiante': 'regular',
                'condicion_especial': '',
                'beca': False,
                'tipo_beca': '',
                'porcentaje_beca': 0,
                'tiene_adecuacion': False,
                'tipo_adecuacion': '',
            },
        )

        if created:
            rol = AuthRol.objects.filter(nombre='estudiante').first()
            if rol:
                AuthUsuarioRol.objects.get_or_create(usuario=usuario, rol=rol)

        return est


class ViewEstudiantes(viewsets.ModelViewSet):
    """ViewSet para gestionar Estudiantes — solo Admin."""
    permission_classes = [IsAdmin]
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

        queryset = PersonasEstudiante.objects.select_related('persona')

        # Por defecto solo activos (para selectores de matrícula, etc.).
        # La pantalla de administración de Estudiantes pide ?incluir_archivados=true
        # para poder mostrar también los archivados y sus contadores.
        incluir_archivados = str(
            self.request.query_params.get('incluir_archivados', '')
        ).lower() in ('1', 'true', 'yes')

        if incluir_archivados:
            return queryset
        return queryset.filter(persona__activo=True)

    def partial_update(self, request, *args, **kwargs):
        if not self._verificar_admin():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permisos para editar estudiantes.')

        # Se busca directo (no via get_object/get_queryset) para poder editar
        # también estudiantes archivados sin depender de ?incluir_archivados=true.
        try:
            instance = PersonasEstudiante.objects.select_related('persona').get(pk=kwargs.get('pk'))
        except PersonasEstudiante.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('Estudiante no encontrado.')
        persona = instance.persona

        persona_fields = [
            'nombre', 'primer_apellido', 'segundo_apellido',
            'identificacion', 'email_personal', 'email_institucional',
            'telefono_principal', 'telefono_secundario'
        ]
        for field in persona_fields:
            if field in request.data:
                setattr(persona, field, request.data.get(field))
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

        from core.utils import set_persona_active_state
        set_persona_active_state(instance.persona, False)

        return Response({'mensaje': 'Estudiante desactivado correctamente.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def reactivar(self, request, pk=None):
        """Revierte el archivado: reactiva persona, estudiante y usuario asociado."""
        if not self._verificar_admin():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permisos para reactivar estudiantes.')

        # Se busca directo (sin pasar por get_queryset/get_object) para que
        # funcione sin importar si el request trae ?incluir_archivados=true.
        try:
            instance = PersonasEstudiante.objects.select_related('persona').get(pk=pk)
        except PersonasEstudiante.DoesNotExist:
            return Response({'error': 'Estudiante no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        from core.utils import set_persona_active_state
        set_persona_active_state(instance.persona, True)
        instance.refresh_from_db()

        serializer = self.get_serializer(instance)
        return Response(
            {'mensaje': 'Estudiante activado correctamente.', 'data': serializer.data},
            status=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):
        if not self._verificar_admin():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permisos para registrar estudiantes.')

        nombre = str(request.data.get('nombre', '')).strip()
        primer_apellido = str(request.data.get('primer_apellido', '')).strip()
        segundo_apellido = str(request.data.get('segundo_apellido', '')).strip()
        identificacion = str(request.data.get('identificacion', '')).strip()
        email = str(request.data.get('email', '')).strip()
        password = str(request.data.get('password', '')).strip() or identificacion
        grupo_id = request.data.get('grupo_id')

        if not nombre or not primer_apellido or not identificacion:
            return Response(
                {'detail': 'nombre, primer_apellido e identificacion son obligatorios.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not grupo_id:
            return Response(
                {'detail': 'Debes asignar el estudiante a un grupo.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            grupo = AcademicoGrupo.objects.get(id=grupo_id, estado__iexact='activo')
        except AcademicoGrupo.DoesNotExist:
            return Response({'detail': 'El grupo seleccionado no existe o no está activo.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                est = _crear_estudiante_usuario(
                    identificacion=identificacion,
                    nombre=nombre,
                    primer_apellido=primer_apellido,
                    segundo_apellido=segundo_apellido,
                    email=email or f'{identificacion}@estudiante.local',
                    password=password,
                )
                AcademicoMatricula.objects.get_or_create(
                    estudiante=est,
                    grupo=grupo,
                    defaults={'fecha_matricula': date.today(), 'estado': 'activo', 'observaciones': ''},
                )
            serializer = self.get_serializer(est)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except IntegrityError as exc:
            return Response({'detail': f'Ya existe un usuario con esa identificación: {exc}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], permission_classes=[IsAdmin])
    def importar(self, request):
        """Importa estudiantes desde CSV o Excel. Crea los que no existan y los matricula en el grupo."""
        import pandas as pd

        grupo_id = request.data.get('grupo_id')
        if not grupo_id:
            return Response({'detail': 'Debes seleccionar un grupo para importar.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            grupo = AcademicoGrupo.objects.get(id=grupo_id, estado__iexact='activo')
        except AcademicoGrupo.DoesNotExist:
            return Response({'detail': 'El grupo seleccionado no existe o no está activo.'}, status=status.HTTP_400_BAD_REQUEST)

        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response({'detail': 'Debes adjuntar un archivo CSV o Excel.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if archivo.name.endswith('.csv'):
                df = pd.read_csv(archivo)
            else:
                df = pd.read_excel(archivo)
        except Exception:
            return Response({'detail': 'No se pudo leer el archivo. Verifica el formato.'}, status=status.HTTP_400_BAD_REQUEST)

        if 'identificacion' not in df.columns:
            return Response({'detail': "El archivo debe incluir la columna 'identificacion'."}, status=status.HTTP_400_BAD_REQUEST)

        creados = 0
        existentes = 0
        errores = []

        for _, row in df.iterrows():
            identificacion = str(row.get('identificacion', '')).strip()
            if not identificacion:
                continue
            nombre = str(row.get('nombre', '')).strip()
            primer_apellido = str(row.get('primer_apellido', '')).strip()
            if not nombre or not primer_apellido:
                errores.append(f'{identificacion} (faltan nombre/primer_apellido)')
                continue
            try:
                with transaction.atomic():
                    ya_existe = PersonasEstudiante.objects.filter(persona__identificacion=identificacion).exists()
                    if ya_existe:
                        existentes += 1
                        est = PersonasEstudiante.objects.get(persona__identificacion=identificacion)
                    else:
                        est = _crear_estudiante_usuario(
                            identificacion=identificacion,
                            nombre=nombre,
                            primer_apellido=primer_apellido,
                            segundo_apellido=str(row.get('segundo_apellido', '')).strip(),
                            email=str(row.get('email', '')).strip() or f'{identificacion}@estudiante.local',
                            password=identificacion,
                        )
                        creados += 1
                    AcademicoMatricula.objects.get_or_create(
                        estudiante=est,
                        grupo=grupo,
                        defaults={'fecha_matricula': date.today(), 'estado': 'activo', 'observaciones': ''},
                    )
            except Exception as exc:
                errores.append(f'{identificacion} ({exc})')

        return Response({
            'message': 'Importación completada.',
            'creados': creados,
            'existentes': existentes,
            'errores': errores,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
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
    permission_classes = [IsDocenteOrAdmin]
    serializer_class = GradoSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['numero_grado', 'nombre']
    ordering = ['numero_grado', 'nombre']

    def get_queryset(self):
        return AcademicoGrado.objects.filter(activo=True).order_by('numero_grado')

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def activos(self, request):
        """Retorna solo los grados activos"""
        grados = AcademicoGrado.objects.filter(activo=True).order_by('numero_grado')
        serializer = self.get_serializer(grados, many=True)
        return Response(serializer.data)


class ViewGrupos(viewsets.ModelViewSet):
    """ViewSet para gestionar Grupos Académicos — Admin gestiona, Docente puede leer."""
    permission_classes = [IsDocenteOrAdmin]
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
        queryset = AcademicoGrupo.objects.select_related(
            'grado', 'docente_guia', 'docente_guia__persona'
        ).filter(grado__activo=True)

        # Por defecto solo grupos activos. La pantalla de administración de
        # Grados y Grupos pide ?incluir_archivados=true para poder mostrar
        # también los inactivos y sus contadores (mismo patrón que Docentes/Estudiantes).
        incluir_archivados = str(
            self.request.query_params.get('incluir_archivados', '')
        ).lower() in ('1', 'true', 'yes')
        if not incluir_archivados:
            queryset = queryset.filter(estado='activo')

        return queryset.order_by('grado__numero_grado', 'nombre')

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

    def partial_update(self, request, *args, **kwargs):
        if not self._verificar_admin():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permisos para editar grupos.')

        instance = self.get_object()

        if 'docente_guia' in request.data:
            docente_persona_id = request.data.get('docente_guia')
            if docente_persona_id:
                docente_obj = _asegurar_docente_por_persona_id(docente_persona_id)
                if not docente_obj:
                    return Response({'error': 'Docente guía inválido.'}, status=status.HTTP_400_BAD_REQUEST)
                instance.docente_guia = docente_obj
            else:
                instance.docente_guia = None

        if 'estado' in request.data:
            nuevo_estado = str(request.data.get('estado') or '').strip().lower()
            if nuevo_estado != 'activo':
                bloqueo = self._error_si_tiene_estudiantes_activos(instance)
                if bloqueo:
                    return bloqueo

        for field in ('nombre', 'aula', 'estado', 'periodo', 'seccion'):
            if field in request.data:
                setattr(instance, field, request.data.get(field))

        if 'grado' in request.data:
            grado_id = request.data.get('grado')
            try:
                instance.grado = AcademicoGrado.objects.get(id=grado_id, activo=True)
            except AcademicoGrado.DoesNotExist:
                return Response({'error': 'Grado inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        instance.fecha_modificacion = timezone.now()
        instance.save()

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def _error_si_tiene_estudiantes_activos(self, instance):
        """
        Devuelve una Response 409 si el grupo aún tiene estudiantes matriculados
        activos, o None si está libre para desactivarse. Un grupo no debe poder
        desactivarse mientras tenga estudiantes, porque quedarían sin grupo.
        """
        total = AcademicoMatricula.objects.filter(
            grupo=instance, estado='activo'
        ).count()
        if total > 0:
            return Response(
                {
                    'error': (
                        f'No se puede desactivar el grupo "{instance.nombre}" porque tiene '
                        f'{total} estudiante(s) matriculado(s). Primero debes moverlos a otro '
                        'grupo o retirarlos, y luego desactivar el grupo vacío.'
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )
        return None

    def destroy(self, request, *args, **kwargs):
        """
        'Eliminar' un grupo en realidad lo desactiva (nunca se borra la fila):
        el historial de matrículas, asistencia y horarios queda intacto.
        Se bloquea si el grupo todavía tiene estudiantes matriculados activos.
        """
        if not self._verificar_admin():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permisos para desactivar grupos.')

        instance = self.get_object()

        bloqueo = self._error_si_tiene_estudiantes_activos(instance)
        if bloqueo:
            return bloqueo

        instance.estado = 'inactivo'
        instance.fecha_modificacion = timezone.now()
        instance.save(update_fields=['estado', 'fecha_modificacion'])

        return Response({'mensaje': 'Grupo desactivado correctamente.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def activar(self, request, pk=None):
        """Revierte la desactivación de un grupo."""
        if not self._verificar_admin():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permisos para activar grupos.')

        # Se busca directo (no via get_object/get_queryset) para que funcione
        # sin depender de ?incluir_archivados=true.
        try:
            instance = AcademicoGrupo.objects.get(pk=pk)
        except AcademicoGrupo.DoesNotExist:
            return Response({'error': 'Grupo no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        instance.estado = 'activo'
        instance.fecha_modificacion = timezone.now()
        instance.save(update_fields=['estado', 'fecha_modificacion'])

        serializer = self.get_serializer(instance)
        return Response(
            {'mensaje': 'Grupo activado correctamente.', 'data': serializer.data},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['get'], permission_classes=[IsAdmin])
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

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
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

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
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

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def por_grado(self, request):
        """
        Retorna grupos organizados por grado.
        Estructura: { "grado_id": <id>, "grado_nombre": "", "grupos": [...] }

        Por defecto solo trae grupos activos. Con ?incluir_archivados=true trae
        también los inactivos, para que la pantalla de administración pueda
        armar las pestañas de Activos/Inactivos (mismo patrón que Docentes/Estudiantes).
        """
        incluir_archivados = str(
            request.query_params.get('incluir_archivados', '')
        ).lower() in ('1', 'true', 'yes')

        grados = AcademicoGrado.objects.filter(activo=True).order_by('numero_grado')
        result = []

        for grado in grados:
            grupos = AcademicoGrupo.objects.filter(
                grado=grado
            ).select_related('docente_guia', 'docente_guia__persona')
            if not incluir_archivados:
                grupos = grupos.filter(estado='activo')

            grupos_serializados = GrupoSerializer(grupos, many=True).data

            result.append({
                'grado_id': grado.id,
                'grado_nombre': grado.nombre,
                'numero_grado': grado.numero_grado,
                'grupos': grupos_serializados,
            })

        return Response(result)
