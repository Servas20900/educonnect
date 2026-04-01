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
from django.http import FileResponse, HttpResponse
from django.core.exceptions import ObjectDoesNotExist
from urllib.request import urlopen
from urllib.error import HTTPError, URLError
from cloudinary.utils import private_download_url
from django.utils.timezone import now
from rest_framework.response import Response
from django.db import IntegrityError
from apps.databaseModels.models import AcademicoGrupo
from apps.notificaciones.services import crear_notificaciones_profesor_hogar

# Create your views here.

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

    @action(detail=True, methods=['get'], url_path='descargar')
    def descargar(self, request, pk=None):
        instance = self.get_object()

        if not instance.archivo_adjunto:
            return response.Response(
                {"error": "Esta circular no tiene archivo adjunto."},
                status=status.HTTP_404_NOT_FOUND,
            )

        filename = instance.archivo_adjunto.name.split('/')[-1]

        # 1) Preferred path for FileField (works in local storage and most cloud storages).
        try:
            file_stream = instance.archivo_adjunto.open('rb')
            file_response = FileResponse(file_stream, as_attachment=True)
            file_response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return file_response
        except Exception:
            pass

        # 2) Explicit storage.open fallback for storages that need direct backend call.
        try:
            file_stream = instance.archivo_adjunto.storage.open(instance.archivo_adjunto.name, 'rb')
            file_response = FileResponse(file_stream, as_attachment=True)
            file_response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return file_response
        except Exception:
            pass

        # 3) Last resort: fetch from resolved URL and stream bytes back to browser.
        try:
            file_url = instance.archivo_adjunto.url
            with urlopen(file_url) as remote_file:
                file_bytes = remote_file.read()
            file_response = HttpResponse(file_bytes, content_type='application/octet-stream')
            file_response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return file_response
        except Exception:
            pass

        # 4) Cloudinary signed URL fallback: try normalized public_id variants server-side.
        full_name = str(instance.archivo_adjunto.name or '').strip().lstrip('/')
        candidate_names = [full_name]
        if full_name.startswith('media/'):
            candidate_names.append(full_name[len('media/'):])

        # Add basename candidates for records that accidentally stored full paths.
        if '/' in full_name:
            candidate_names.append(full_name.split('/')[-1])

        candidate_public_ids = []
        for candidate in candidate_names:
            if not candidate:
                continue

            if '.' in candidate:
                public_id = candidate.rsplit('.', 1)[0]
                extension = candidate.rsplit('.', 1)[1]
            else:
                public_id = candidate
                extension = None

            if public_id:
                candidate_public_ids.append(public_id)

            # Also try without directories when cloud resource was saved with basename only.
            if '/' in public_id:
                candidate_public_ids.append(public_id.split('/')[-1])

        # Remove duplicates while preserving order.
        unique_public_ids = []
        seen_public_ids = set()
        for pid in candidate_public_ids:
            if pid and pid not in seen_public_ids:
                seen_public_ids.add(pid)
                unique_public_ids.append(pid)

        # Try explicit extension first, then common allowed extensions, then none.
        format_candidates = []
        for candidate in candidate_names:
            if '.' in candidate:
                format_candidates.append(candidate.rsplit('.', 1)[1])
        format_candidates.extend(['pdf', 'docx', 'jpg', 'jpeg', 'png', 'html', 'htm', None])

        unique_formats = []
        seen_formats = set()
        for fmt in format_candidates:
            key = str(fmt)
            if key not in seen_formats:
                seen_formats.add(key)
                unique_formats.append(fmt)

        resource_types = ['raw', 'image']
        delivery_types = ['upload', 'authenticated']

        for public_id in unique_public_ids:
            for fmt in unique_formats:
                for resource_type in resource_types:
                    for delivery_type in delivery_types:
                        try:
                            signed_download_url = private_download_url(
                                public_id=public_id,
                                format=fmt,
                                resource_type=resource_type,
                                type=delivery_type,
                                attachment=True,
                            )
                            with urlopen(signed_download_url) as remote_file:
                                file_bytes = remote_file.read()
                            file_response = HttpResponse(file_bytes, content_type='application/octet-stream')
                            file_response['Content-Disposition'] = f'attachment; filename="{filename}"'
                            return file_response
                        except (HTTPError, URLError, Exception):
                            continue

        return response.Response(
            {"error": "Archivo no encontrado en el almacenamiento remoto."},
            status=status.HTTP_404_NOT_FOUND,
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