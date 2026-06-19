from django.shortcuts import render
from .serializers import *
from rest_framework import viewsets, permissions, status, response, filters
from .models import *
from rest_framework.views import APIView
from django.db.models import Q, Count, Max
from rest_framework.decorators import action
from datetime import datetime, timedelta, date
from django.db.models import Case, Value, When, IntegerField
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied
from django.http import FileResponse, HttpResponse
from django.core.exceptions import ObjectDoesNotExist
from urllib.request import urlopen
from urllib.error import HTTPError, URLError
from cloudinary.utils import private_download_url
from django.utils.timezone import now
from rest_framework.response import Response
from django.db import IntegrityError, transaction
from django.contrib.auth.hashers import make_password
from apps.databaseModels.models import AcademicoGrupo
from apps.notificaciones.services import crear_notificaciones_profesor_hogar
from apps.databaseModels.comunicaciones.circulares.views import ViewComunicacionesCircular

# Create your views here.


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


def _get_docente_from_user(user):
    candidate_ids = _get_docente_candidate_ids(user)
    if not candidate_ids:
        return None
    return PersonasDocente.objects.filter(persona_id__in=candidate_ids).first()


def _get_docente_candidate_ids(user):
    candidate_ids = set()
    persona_id = getattr(user, 'persona_id', None)
    if persona_id:
        candidate_ids.add(persona_id)
    if getattr(user, 'id', None):
        candidate_ids.add(user.id)
    return list(candidate_ids)


def _get_docente_ids_from_user(user):
    candidate_ids = _get_docente_candidate_ids(user)
    if not candidate_ids:
        return []
    docentes_ids = list(
        PersonasDocente.objects.filter(persona_id__in=candidate_ids).values_list('persona_id', flat=True)
    )
    return docentes_ids or candidate_ids


def _docente_can_access_grupo(docente, grupo_id):
    if not docente:
        return False
    return AcademicoGrupo.objects.filter(
        docente_guia=docente,
        id=grupo_id,
        estado__iexact='activo',
    ).exists()


def _docente_ids_can_access_grupo(docente_ids, grupo_id):
    if not docente_ids:
        return False
    return AcademicoGrupo.objects.filter(
        docente_guia_id__in=docente_ids,
        id=grupo_id,
        estado__iexact='activo',
    ).exists()


def _resolve_grupo_for_docente(request, grupo_id):
    docente_ids = _get_docente_ids_from_user(request.user)
    if not docente_ids:
        return None
    if not _docente_ids_can_access_grupo(docente_ids, grupo_id):
        return None
    return AcademicoGrupo.objects.filter(id=grupo_id).first()
    
class GrupoEstudiantesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, grupo_id):
        """
        Lista los estudiantes matriculados en un grupo
        """
        grupo = _resolve_grupo_for_docente(request, grupo_id)
        if not grupo:
            return Response(
                {"detail": "Grupo no disponible para este docente."},
                status=status.HTTP_404_NOT_FOUND
            )

        matriculas = AcademicoMatricula.objects.select_related(
            "estudiante__persona",
            "grupo"
        ).filter(grupo=grupo, estado__iexact="activo")

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

        grupo = _resolve_grupo_for_docente(request, grupo_id)
        if not grupo:
            return Response(
                {"detail": "Grupo no disponible para este docente."},
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

        grupo = _resolve_grupo_for_docente(request, grupo_id)
        if not grupo:
            return Response(
                {"detail": "Grupo no disponible para este docente."},
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

        creados = 0
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
                # Intentar crear el estudiante si tiene los datos necesarios
                nombre = str(row.get("nombre", "")).strip()
                primer_apellido = str(row.get("primer_apellido", "")).strip()
                if not nombre or not primer_apellido:
                    errores.append(f"{identificacion} (faltan nombre/apellido para crearlo)")
                    continue
                try:
                    with transaction.atomic():
                        nuevo_est = _crear_usuario_estudiante(
                            identificacion=identificacion,
                            nombre=nombre,
                            primer_apellido=primer_apellido,
                            segundo_apellido=str(row.get("segundo_apellido", "")).strip(),
                            email=str(row.get("email", "")).strip() or f"{identificacion}@estudiante.local",
                            password=identificacion,
                        )
                        AcademicoMatricula.objects.create(
                            estudiante=nuevo_est,
                            grupo=grupo,
                            fecha_matricula=now().date(),
                            estado="activo",
                            observaciones="",
                        )
                    agregados += 1
                    creados += 1
                except Exception as exc:
                    errores.append(f"{identificacion} (error al crear: {exc})")

        return Response(
            {
                "message": "Importación completada.",
                "creados": creados,
                "agregados": agregados,
                "duplicados": duplicados,
                "no_encontrados": errores,
            },
            status=status.HTTP_200_OK,
        )


def _generar_codigo_estudiante():
    ultimo = PersonasEstudiante.objects.order_by("-codigo_estudiante").values_list("codigo_estudiante", flat=True).first()
    if ultimo:
        try:
            num = int(str(ultimo).split("-")[-1]) + 1
        except ValueError:
            num = PersonasEstudiante.objects.count() + 1
    else:
        num = 1
    return f"EST-{num:05d}"


def _crear_usuario_estudiante(identificacion, nombre, primer_apellido, segundo_apellido="", email="", password=None):
    """Crea AuthUsuario + PersonasPersona + PersonasEstudiante y asigna rol estudiante."""
    if not email:
        email = f"{identificacion}@estudiante.local"
    if not password:
        password = identificacion

    with transaction.atomic():
        persona, _ = PersonasPersona.objects.get_or_create(
            identificacion=identificacion,
            defaults={
                "nombre": nombre,
                "primer_apellido": primer_apellido,
                "segundo_apellido": segundo_apellido,
                "fecha_nacimiento": date(2000, 1, 1),
                "genero": "No especificado",
                "tipo_identificacion": "cedula",
                "nacionalidad": "costarricense",
                "telefono_principal": "00000000",
                "telefono_secundario": "",
                "email_personal": email,
                "email_institucional": email,
                "direccion_exacta": "No especificada",
                "provincia": "No especificada",
                "canton": "No especificado",
                "distrito": "No especificado",
                "estado_civil": "No especificado",
                "notas": "",
            },
        )

        usuario, created = AuthUsuario.objects.get_or_create(
            persona=persona,
            defaults={
                "username": identificacion,
                "email": email,
                "password": make_password(password),
                "is_active": True,
            },
        )

        est, _ = PersonasEstudiante.objects.get_or_create(
            persona=persona,
            defaults={
                "codigo_estudiante": _generar_codigo_estudiante(),
                "fecha_ingreso": date.today(),
                "estado_estudiante": "activo",
                "tipo_estudiante": "regular",
                "condicion_especial": "",
                "beca": False,
                "tipo_beca": "",
                "porcentaje_beca": 0,
                "tiene_adecuacion": False,
                "tipo_adecuacion": "",
            },
        )

        if created:
            try:
                rol = AuthRol.objects.filter(nombre="estudiante").first()
                if rol:
                    AuthUsuarioRol.objects.get_or_create(usuario=usuario, rol=rol)
            except Exception:
                pass

        return est


class RegistrarEstudianteView(APIView):
    """Crea un nuevo usuario estudiante y lo matricula en el grupo."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, grupo_id):
        grupo = _resolve_grupo_for_docente(request, grupo_id)
        if not grupo:
            return Response({"detail": "Grupo no disponible para este docente."}, status=status.HTTP_404_NOT_FOUND)

        nombre = str(request.data.get("nombre", "")).strip()
        primer_apellido = str(request.data.get("primer_apellido", "")).strip()
        segundo_apellido = str(request.data.get("segundo_apellido", "")).strip()
        identificacion = str(request.data.get("identificacion", "")).strip()
        email = str(request.data.get("email", "")).strip()
        password = str(request.data.get("password", "")).strip() or identificacion

        if not nombre or not primer_apellido or not identificacion:
            return Response(
                {"detail": "nombre, primer_apellido e identificacion son obligatorios."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verificar duplicado en el grupo
        est_existente = PersonasEstudiante.objects.filter(persona__identificacion=identificacion).first()
        if est_existente and AcademicoMatricula.objects.filter(estudiante=est_existente, grupo=grupo).exists():
            return Response({"detail": "Ese estudiante ya está matriculado en este grupo."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                est = _crear_usuario_estudiante(
                    identificacion=identificacion,
                    nombre=nombre,
                    primer_apellido=primer_apellido,
                    segundo_apellido=segundo_apellido,
                    email=email or f"{identificacion}@estudiante.local",
                    password=password,
                )
                matricula, created = AcademicoMatricula.objects.get_or_create(
                    estudiante=est,
                    grupo=grupo,
                    defaults={"fecha_matricula": now().date(), "estado": "activo", "observaciones": ""},
                )
                if not created:
                    return Response({"detail": "El estudiante ya está en este grupo."}, status=status.HTTP_400_BAD_REQUEST)

            return Response(
                {"message": "Estudiante registrado correctamente.", "codigo_estudiante": est.codigo_estudiante},
                status=status.HTTP_201_CREATED,
            )
        except IntegrityError as exc:
            return Response({"detail": f"Error de integridad: {exc}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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

        grupo = getattr(matricula, 'grupo', None)
        if not grupo or not _resolve_grupo_for_docente(request, grupo.id):
            return Response(
                {"detail": "No tienes permisos para modificar este grupo."},
                status=status.HTTP_403_FORBIDDEN
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
        persona_id = getattr(request.user, 'persona_id', None)
        if not persona_id:
            return Response([], status=status.HTTP_200_OK)

        docente = PersonasDocente.objects.filter(persona_id=persona_id).first()
        if not docente:
            return Response([], status=status.HTTP_200_OK)

        grupos = AcademicoGrupo.objects.filter(
            docente_guia=docente,
            estado__iexact='activo',
        ).order_by('grado__numero_grado', 'seccion__nombre', 'nombre')

        data = []
        for g in grupos:
            data.append({
                "id": g.id,
                "nombre": g.nombre,
                "codigo_grupo": g.codigo_grupo,
                "label": f"{g.nombre} ({g.codigo_grupo})"
            })

        return Response(data, status=status.HTTP_200_OK)