from django.shortcuts import render
from .serializers import *
from rest_framework import viewsets, permissions, status, response, filters
from .models import * 
from rest_framework.views import APIView
from django.db.models import Q, Count, Max
from rest_framework.decorators import action
from datetime import datetime, timedelta
from django.db.models import Case, Value, When, IntegerField
from rest_framework.parsers import MultiPartParser, FormParser 
from rest_framework.exceptions import PermissionDenied
from django.utils.timezone import now
from rest_framework.response import Response
from django.db import IntegrityError
from apps.databaseModels.models import AcademicoGrupo
from apps.notificaciones.services import crear_notificaciones_profesor_hogar

class ViewComunicacionesCircular(viewsets.ModelViewSet):
    queryset = ComunicacionesCircular.objects.annotate(
    prioridad_estado=Case(
        When(estado="Publicado", then=Value(1)),
        When(estado="Borrador", then=Value(2)),
        When(estado="Inactivo", then=Value(3)),
        default=Value(4),
        output_field=IntegerField(),
    )
).order_by('prioridad_estado', '-fecha_creacion')
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [permissions.IsAuthenticated]
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WriteSerializerComunicacionesCircular
        return ReadSerializerComunicacionesCircular
    def perform_create(self, serializer):
        serializer.save(creada_por=self.request.user)
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.estado !='Inactivo':
            instance.estado = 'Borrador'
        else :
            instance.estado = 'Inactivo'
            
        instance.save()
        return response.Response(
            {"message": f"Circular '{instance.titulo}' marcada como inactiva."}, 
            status=status.HTTP_200_OK
        )


class ViewComunicacionesComunicado(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WriteSerializerComunicacionesComunicado
        return ReadSerializerComunicacionesComunicado

    def _obtener_rol(self):
        if self.request.user.is_superuser:
            return 'administrador'

        usuario_rol = AuthUsuarioRol.objects.filter(usuario=self.request.user).select_related('rol').first()
        if usuario_rol and usuario_rol.rol:
            return usuario_rol.rol.nombre.lower()
        return 'usuario'

    def _puede_emitir(self):
        return self._obtener_rol() in {'docente', 'administrador'}

    def get_queryset(self):
        queryset = ComunicacionesComunicado.objects.select_related('publicado_por').order_by('-fecha_publicacion')
        rol = self._obtener_rol()

        if rol == 'administrador':
            return queryset

        if rol == 'docente':
            return queryset.filter(publicado_por=self.request.user)

        if rol == 'estudiante':
            return queryset.filter(visible=True, destinatarios__contains=['estudiantes'])

        if rol == 'encargado':
            return queryset.filter(visible=True, destinatarios__contains=['encargados'])

        return queryset.filter(visible=True)

    def perform_create(self, serializer):
        if not self._puede_emitir():
            raise PermissionDenied('Solo docentes o administradores pueden emitir comunicados.')
        
        comunicado = serializer.save(publicado_por=self.request.user)
        crear_notificaciones_profesor_hogar(comunicado)

    def perform_update(self, serializer):
        if not self._puede_emitir():
            raise PermissionDenied('Solo docentes o administradores pueden editar comunicados.')

        instance = self.get_object()
        if self._obtener_rol() != 'administrador' and instance.publicado_por_id != self.request.user.id:
            raise PermissionDenied('Solo puedes editar tus propios comunicados.')

        serializer.save()

    def destroy(self, request, *args, **kwargs):
        if not self._puede_emitir():
            raise PermissionDenied('Solo docentes o administradores pueden ocultar comunicados.')

        instance = self.get_object()
        if self._obtener_rol() != 'administrador' and instance.publicado_por_id != request.user.id:
            raise PermissionDenied('Solo puedes ocultar tus propios comunicados.')

        instance.visible = False
        instance.save(update_fields=['visible'])

        return response.Response(
            {"message": f"Comunicado '{instance.titulo}' ocultado correctamente."},
            status=status.HTTP_200_OK
        )

class RegistroUsuarioView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegistroSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return response.Response(
                {"mensaje": "Usuario registrado exitosamente"}, 
                status=status.HTTP_201_CREATED
            )
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ViewEstudiantes(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EstudianteListadoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'usuario__persona__nombre',
        'usuario__persona__primer_apellido',
        'usuario__persona__segundo_apellido',
        'usuario__persona__identificacion',
        'usuario__persona__personasestudiante__codigo_estudiante',
        'usuario__persona__personasestudiante__academicomatricula__grupo__nombre',
        'usuario__persona__personasestudiante__academicomatricula__grupo__codigo_grupo'
    ]
    ordering_fields = [
        'usuario__persona__primer_apellido',
        'usuario__persona__nombre',
        'usuario__persona__personasestudiante__codigo_estudiante'
    ]
    ordering = ['usuario__persona__primer_apellido', 'usuario__persona__nombre']

    def _get_role_names(self):
        if self.request.user and self.request.user.is_superuser:
            return {'administrador'}

        role_values = AuthUsuarioRol.objects.filter(usuario=self.request.user).values_list('rol__nombre', flat=True)
        return {str(role or '').strip().lower() for role in role_values}

    def _has_allowed_role(self):
        roles = self._get_role_names()
        return bool({'administrador', 'admin', 'docente'} & roles)

    def get_queryset(self):
        if not self._has_allowed_role():
            raise PermissionDenied('No tienes permisos para consultar estudiantes.')

        roles = self._get_role_names()
        is_admin = bool({'administrador', 'admin'} & roles)
        is_docente = 'docente' in roles and not is_admin

        queryset = AuthUsuarioRol.objects.select_related(
            'usuario',
            'usuario__persona',
            'rol'
        ).filter(
            rol__nombre__icontains='estudiante',
            usuario__is_active=True
        )

        if is_docente:
            persona = getattr(self.request.user, 'persona', None)
            if not persona:
                return queryset.none()

            queryset = queryset.filter(
                usuario__persona__personasestudiante__academicomatricula__grupo__academicodocentegrupo__docente_id=persona.id
            )

        grupo_id = self.request.query_params.get('grupo_id')
        grupo_codigo = self.request.query_params.get('grupo_codigo')

        if grupo_id:
            queryset = queryset.filter(
                usuario__persona__personasestudiante__academicomatricula__grupo_id=grupo_id
            )

        if grupo_codigo:
            queryset = queryset.filter(
                usuario__persona__personasestudiante__academicomatricula__grupo__codigo_grupo__iexact=grupo_codigo
            )

        return queryset.distinct()
    
class GrupoEstudiantesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, grupo_id):
        """
        Lista los estudiantes matriculados en un grupo
        """
        matriculas = AcademicoMatricula.objects.select_related(
            "estudiante__persona",
            "grupo"
        ).filter(grupo_id=grupo_id, estado="activo")

        data = []
        for m in matriculas:
            persona = getattr(m.estudiante, "persona", None)

            data.append({
                "matricula_id": m.id,
                "grupo_id": m.grupo.id if m.grupo else None,
                "persona_id": persona.id if persona else None,
                "nombre": f"{persona.nombre} {persona.primer_apellido} {persona.segundo_apellido or ''}".strip() if persona else "N/A",
                "identificacion": persona.identificacion if persona else "N/A",
                "email": (
                    persona.email_institucional
                    or persona.email_personal
                    or "N/A"
                ) if persona else "N/A",
                "codigo_estudiante": m.estudiante.codigo_estudiante if m.estudiante else "N/A",
                "estado": m.estado,
            })

        return Response(data, status=status.HTTP_200_OK)

    def post(self, request, grupo_id):
        """
        Registrar estudiante manualmente en un grupo
        body: { "persona_id": 1 }
        """
        persona_id = request.data.get("persona_id")

        if not persona_id:
            return Response(
                {"detail": "persona_id es requerido."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            grupo = AcademicoGrupo.objects.get(id=grupo_id)
        except AcademicoGrupo.DoesNotExist:
            return Response(
                {"detail": "Grupo no encontrado."},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            estudiante = PersonasEstudiante.objects.get(persona_id=persona_id)
        except PersonasEstudiante.DoesNotExist:
            return Response(
                {"detail": "El estudiante no existe."},
                status=status.HTTP_404_NOT_FOUND
            )

        # evitar duplicados
        existente = AcademicoMatricula.objects.filter(
            estudiante=estudiante,
            grupo=grupo
        ).first()

        if existente:
            return Response(
                {"detail": "Ese estudiante ya está registrado en este grupo."},
                status=status.HTTP_400_BAD_REQUEST
            )

        matricula = AcademicoMatricula.objects.create(
            estudiante=estudiante,
            grupo=grupo,
            fecha_matricula=now().date(),
            estado="activo",
            observaciones=""
        )

        return Response(
            {
                "message": "Estudiante registrado correctamente.",
                "matricula_id": matricula.id
            },
            status=status.HTTP_201_CREATED
        )


class GrupoEstudiantesImportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, grupo_id):
        """
        Importar lista de estudiantes desde CSV/Excel
        espera archivo en request.FILES["archivo"]
        """
        import pandas as pd

        archivo = request.FILES.get("archivo")

        if not archivo:
            return Response(
                {"detail": "Debes adjuntar un archivo CSV o Excel."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            grupo = AcademicoGrupo.objects.get(id=grupo_id)
        except AcademicoGrupo.DoesNotExist:
            return Response(
                {"detail": "Grupo no encontrado."},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            if archivo.name.endswith(".csv"):
                df = pd.read_csv(archivo)
            else:
                df = pd.read_excel(archivo)
        except Exception:
            return Response(
                {"detail": "No se pudo leer el archivo. Verifica formato CSV/Excel."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if "identificacion" not in df.columns:
            return Response(
                {"detail": "El archivo debe incluir la columna 'identificacion'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        agregados = 0
        duplicados = 0
        errores = []

        for _, row in df.iterrows():
            identificacion = str(row.get("identificacion", "")).strip()

            if not identificacion:
                continue

            try:
                estudiante = PersonasEstudiante.objects.select_related("persona").get(
                    persona__identificacion=identificacion
                )

                existe = AcademicoMatricula.objects.filter(
                    estudiante=estudiante,
                    grupo=grupo
                ).exists()

                if existe:
                    duplicados += 1
                    continue

                AcademicoMatricula.objects.create(
                    estudiante=estudiante,
                    grupo=grupo,
                    fecha_matricula=now().date(),
                    estado="activo",
                    observaciones=""
                )
                agregados += 1

            except PersonasEstudiante.DoesNotExist:
                errores.append(identificacion)

        return Response(
            {
                "message": "Importación completada.",
                "agregados": agregados,
                "duplicados": duplicados,
                "no_encontrados": errores
            },
            status=status.HTTP_200_OK
        )


class GrupoEstudianteRemoveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, matricula_id):
        try:
            matricula = AcademicoMatricula.objects.get(id=matricula_id)
        except AcademicoMatricula.DoesNotExist:
            return Response(
                {"detail": "Matrícula no encontrada."},
                status=status.HTTP_404_NOT_FOUND
            )

        matricula.estado = "inactivo"
        matricula.save()

        return Response(
            {"message": "Estudiante removido del grupo."},
            status=status.HTTP_200_OK
        )
    
class GruposDocenteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        grupos = AcademicoGrupo.objects.filter(docente=request.user)

        data = []
        for g in grupos:
            data.append({
                "id": g.id,
                "nombre": getattr(g, "nombre", f"Grupo {g.id}")
            })

        return Response(data, status=status.HTTP_200_OK)