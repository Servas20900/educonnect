from rest_framework import viewsets, permissions, serializers
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.decorators import action
from django.http import FileResponse
from rest_framework.response import Response
from rest_framework import status
from django.core.files.base import ContentFile
from django.utils import timezone
from io import BytesIO
import uuid

from .models import Exportacion
from apps.databaseModels.models import (
    PersonasDocente,
    PersonasEstudiante,
    AcademicoMatricula,
    AuthUsuarioRol,
)
from apps.permisos.models import ConfiguracionSistema
from apps.permisos.defaults import DEFAULT_CONFIGURATION_MAP

class ExportacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exportacion
        fields = "__all__"
        read_only_fields = ["docente", "creado", "actualizado"]

class ViewExportaciones(viewsets.ModelViewSet):
    serializer_class = ExportacionSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def _is_admin(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.is_staff:
            return True
        return AuthUsuarioRol.objects.filter(
            usuario=user,
            rol__nombre__icontains='admin'
        ).exists()

    def _forbid_if_not_admin(self):
        if self._is_admin():
            return None
        return Response(
            {'detail': 'Solo administración puede realizar esta acción.'},
            status=status.HTTP_403_FORBIDDEN
        )

    def _build_xlsx(self, headers, rows):
        from openpyxl import Workbook

        wb = Workbook()
        ws = wb.active
        ws.title = 'Exportacion'
        ws.append(headers)
        for row in rows:
            ws.append(row)

        output = BytesIO()
        wb.save(output)
        output.seek(0)
        return output.getvalue()

    def _save_generated_export(self, base_name, formato, content, extension):
        exportacion = Exportacion.objects.create(
            docente=self.request.user,
            nombre=base_name,
            formato=formato,
        )
        filename = f'exportaciones/{base_name}_{uuid.uuid4().hex[:8]}.{extension}'
        exportacion.archivo.save(filename, ContentFile(content), save=True)
        return exportacion

    def _docentes_rows(self):
        docentes = PersonasDocente.objects.select_related('persona').order_by(
            'persona__primer_apellido', 'persona__nombre'
        )
        headers = [
            'Codigo', 'Nombre', 'Identificacion', 'Email Institucional',
            'Especialidad', 'Estado Laboral', 'Fecha Ingreso'
        ]
        rows = []
        for docente in docentes:
            persona = docente.persona
            nombre_completo = f"{persona.nombre} {persona.primer_apellido} {persona.segundo_apellido or ''}".strip()
            rows.append([
                docente.codigo_empleado,
                nombre_completo,
                persona.identificacion,
                persona.email_institucional,
                docente.especialidad,
                docente.estado_laboral,
                docente.fecha_ingreso.isoformat() if docente.fecha_ingreso else '',
            ])
        return headers, rows

    def _estudiantes_rows(self):
        estudiantes = PersonasEstudiante.objects.select_related('persona').order_by(
            'persona__primer_apellido', 'persona__nombre'
        )
        headers = [
            'Codigo', 'Nombre', 'Identificacion', 'Email Institucional',
            'Estado', 'Grupo Actual', 'Fecha Ingreso'
        ]
        rows = []
        for estudiante in estudiantes:
            persona = estudiante.persona
            nombre_completo = f"{persona.nombre} {persona.primer_apellido} {persona.segundo_apellido or ''}".strip()

            matricula = (
                AcademicoMatricula.objects.filter(estudiante=estudiante, estado='activo')
                .select_related('grupo')
                .order_by('-fecha_matricula')
                .first()
            )
            grupo = matricula.grupo.nombre if matricula and matricula.grupo else ''

            rows.append([
                estudiante.codigo_estudiante,
                nombre_completo,
                persona.identificacion,
                persona.email_institucional,
                estudiante.estado_estudiante,
                grupo,
                estudiante.fecha_ingreso.isoformat() if estudiante.fecha_ingreso else '',
            ])
        return headers, rows

    def get_queryset(self):
        return Exportacion.objects.filter(docente=self.request.user).order_by("-actualizado")

    def perform_create(self, serializer):
        serializer.save(docente=self.request.user)

    @action(detail=False, methods=['post'], url_path='exportar_docentes')
    def exportar_docentes(self, request):
        denied = self._forbid_if_not_admin()
        if denied:
            return denied

        formato = str(request.data.get('formato', 'XLSX')).upper()
        if formato != 'XLSX':
            return Response(
                {'detail': 'Solo se permite formato XLSX.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        headers, rows = self._docentes_rows()

        try:
            content = self._build_xlsx(headers, rows)
            exportacion = self._save_generated_export('docentes', 'XLSX', content, 'xlsx')
        except ImportError as exc:
            return Response(
                {'detail': f'Dependencia faltante para exportación: {exc}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {
                'message': 'Exportación de docentes generada correctamente',
                'id': exportacion.id,
                'nombre': exportacion.nombre,
                'formato': exportacion.formato,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=['post'], url_path='exportar_estudiantes')
    def exportar_estudiantes(self, request):
        denied = self._forbid_if_not_admin()
        if denied:
            return denied

        formato = str(request.data.get('formato', 'XLSX')).upper()
        if formato != 'XLSX':
            return Response(
                {'detail': 'Solo se permite formato XLSX.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        headers, rows = self._estudiantes_rows()

        try:
            content = self._build_xlsx(headers, rows)
            exportacion = self._save_generated_export('estudiantes', 'XLSX', content, 'xlsx')
        except ImportError as exc:
            return Response(
                {'detail': f'Dependencia faltante para exportación: {exc}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {
                'message': 'Exportación de estudiantes generada correctamente',
                'id': exportacion.id,
                'nombre': exportacion.nombre,
                'formato': exportacion.formato,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=['get', 'put'], url_path='retencion_politicas')
    def retencion_politicas(self, request):
        denied = self._forbid_if_not_admin()
        if denied:
            return denied

        default_catalogs = DEFAULT_CONFIGURATION_MAP['catalogs']['valor']
        config, _ = ConfiguracionSistema.objects.get_or_create(
            clave='catalogs',
            defaults={
                'descripcion': DEFAULT_CONFIGURATION_MAP['catalogs']['descripcion'],
                'valor': default_catalogs,
                'activo': True,
            }
        )

        valor = config.valor if isinstance(config.valor, dict) else {}
        politicas = valor.get('retencion_politicas')
        if not isinstance(politicas, list):
            politicas = default_catalogs.get('retencion_politicas', [])

        if request.method == 'GET':
            return Response({'retencion_politicas': politicas})

        nuevas = request.data.get('retencion_politicas', [])
        if not isinstance(nuevas, list):
            return Response(
                {'detail': 'retencion_politicas debe ser una lista.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        normalizadas = []
        for idx, item in enumerate(nuevas, start=1):
            if not isinstance(item, dict):
                return Response({'detail': f'Entrada inválida en índice {idx - 1}.'}, status=status.HTTP_400_BAD_REQUEST)

            nombre = str(item.get('nombre', '')).strip()
            retencion = str(item.get('retencion', '')).strip()
            accion = str(item.get('accion', '')).strip()
            alcance = str(item.get('alcance', '')).strip()

            if not nombre or not retencion or not accion or not alcance:
                return Response(
                    {'detail': f'La política #{idx} requiere nombre, retencion, accion y alcance.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            normalizadas.append({
                'id': item.get('id') or idx,
                'nombre': nombre,
                'retencion': retencion,
                'accion': accion,
                'alcance': alcance,
            })

        valor['retencion_politicas'] = normalizadas
        config.valor = valor
        config.activo = True
        config.save(update_fields=['valor', 'activo', 'fecha_modificacion'])

        return Response(
            {'message': 'Políticas de retención actualizadas', 'retencion_politicas': normalizadas},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["get"], url_path="archivo")
    def descargar_archivo(self, request, pk=None):
        exp = self.get_object()

        if not exp.archivo:
            return Response({"detail": "No hay archivo."}, status=status.HTTP_404_NOT_FOUND)

        # Cloudinary/raw storage: abrir con storage.open
        f = exp.archivo.open("rb")
        response = FileResponse(f, as_attachment=True)

        # nombre sugerido
        filename = exp.archivo.name.split("/")[-1]
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response