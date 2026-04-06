import os
import unicodedata
from django.conf import settings
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from apps.databaseModels.models import HorariosIncapacidad, PersonasDocente, AuthUsuarioRol
from .serializers import HorariosIncapacidadReadSerializer, HorariosIncapacidadWriteSerializer


def _normalizar_nombre_rol(valor):
    limpio = unicodedata.normalize('NFKD', str(valor or ''))
    limpio = ''.join(ch for ch in limpio if not unicodedata.combining(ch))
    return limpio.strip().lower()


def _es_admin(user):
    if getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False):
        return True
    nombres_roles = AuthUsuarioRol.objects.filter(usuario=user).values_list('rol__nombre', flat=True)
    aliases_admin = {'administrador', 'administracion', 'admin'}
    return any(_normalizar_nombre_rol(nombre) in aliases_admin for nombre in nombres_roles)


def _docente_de_usuario(user):
    if not getattr(user, 'persona_id', None):
        return None
    return PersonasDocente.objects.filter(persona_id=user.persona_id).first()


def _generar_codigo_empleado(persona_id):
    base = f"DOC-{persona_id}"
    if not PersonasDocente.objects.filter(codigo_empleado=base).exists():
        return base

    secuencia = 1
    while True:
        candidato = f"{base}-{secuencia}"
        if not PersonasDocente.objects.filter(codigo_empleado=candidato).exists():
            return candidato
        secuencia += 1


def _asegurar_docente_por_persona_id(persona_id):
    if not persona_id:
        return None

    docente = PersonasDocente.objects.filter(persona_id=persona_id).first()
    if docente:
        return docente

    tiene_rol_docente = AuthUsuarioRol.objects.filter(
        usuario__persona_id=persona_id,
        usuario__is_active=True,
        rol__tipo_rol='docente',
    ).exists()
    if not tiene_rol_docente:
        return None

    return PersonasDocente.objects.create(
        persona_id=persona_id,
        codigo_empleado=_generar_codigo_empleado(persona_id),
        especialidad='General',
        nivel_academico='No especificado',
        fecha_ingreso=timezone.localdate(),
        fecha_salida=None,
        estado_laboral='Activo',
        tipo_contrato='No especificado',
        horas_contratadas=0,
        salario_base=None,
        numero_cuenta_bancaria='No especificada',
        titulo_profesional='No especificado',
        universidad='No especificada',
        año_graduacion=None,
    )


def _save_upload(file, folder):
    os.makedirs(os.path.join(settings.MEDIA_ROOT, folder), exist_ok=True)
    filename = f"{timezone.now().strftime('%Y%m%d_%H%M%S')}_{file.name}"
    relative_path = os.path.join(folder, filename).replace('\\', '/')
    full_path = os.path.join(settings.MEDIA_ROOT, relative_path)
    with open(full_path, 'wb+') as dest:
        for chunk in file.chunks():
            dest.write(chunk)
    return relative_path


class ViewHorariosIncapacidad(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = HorariosIncapacidad.objects.select_related('docente__persona', 'registrada_por').order_by('-fecha_creacion', '-id')
        user = self.request.user

        if _es_admin(user):
            docente_id = self.request.query_params.get('docente_id')
            tipo = self.request.query_params.get('tipo')
            fecha_desde = self.request.query_params.get('fecha_desde')
            fecha_hasta = self.request.query_params.get('fecha_hasta')

            if docente_id:
                qs = qs.filter(docente_id=docente_id)
            if tipo:
                qs = qs.filter(tipo=tipo)
            if fecha_desde:
                qs = qs.filter(fecha_creacion__gte=fecha_desde)
            if fecha_hasta:
                qs = qs.filter(fecha_creacion__lte=fecha_hasta)
            return qs

        docente = _docente_de_usuario(user)
        if not docente:
            return HorariosIncapacidad.objects.none()
        return qs.filter(docente=docente)

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return HorariosIncapacidadWriteSerializer
        return HorariosIncapacidadReadSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = HorariosIncapacidadReadSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        mutable = request.data.copy()

        if _es_admin(request.user):
            docente_id = mutable.get('docente')
            if not docente_id:
                return Response({'docente': ['Este campo es requerido']}, status=status.HTTP_400_BAD_REQUEST)

            docente_resuelto = _asegurar_docente_por_persona_id(docente_id)
            if not docente_resuelto:
                raise ValidationError({'docente': 'No existe un docente valido para la persona seleccionada'})
            mutable['docente'] = docente_resuelto.pk

        serializer = HorariosIncapacidadWriteSerializer(data=mutable)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        archivo = data.pop('archivo', None)

        if not _es_admin(request.user):
            docente = _docente_de_usuario(request.user)
            if not docente:
                return Response({'detail': 'No existe perfil docente asociado al usuario'}, status=status.HTTP_403_FORBIDDEN)
            data['docente'] = docente

        doc_path = _save_upload(archivo, 'incapacidades') if archivo else ''
        obj = HorariosIncapacidad.objects.create(
            **data,
            documento_adjunto=doc_path,
            registrada_por=request.user,
            fecha_registro=timezone.now(),
            estado='aprobada',
        )
        return Response(HorariosIncapacidadReadSerializer(obj, context={'request': request}).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()

        if not _es_admin(request.user):
            docente = _docente_de_usuario(request.user)
            if not docente or instance.docente_id != docente.pk:
                raise PermissionDenied('No tenes permiso para editar este registro')

        mutable = request.data.copy()
        if _es_admin(request.user):
            docente_id = mutable.get('docente')
            if docente_id:
                docente_resuelto = _asegurar_docente_por_persona_id(docente_id)
                if not docente_resuelto:
                    raise ValidationError({'docente': 'No existe un docente valido para la persona seleccionada'})
                mutable['docente'] = docente_resuelto.pk

        serializer = HorariosIncapacidadWriteSerializer(instance, data=mutable, partial=True)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        archivo = data.pop('archivo', None)

        if not _es_admin(request.user):
            data.pop('docente', None)

        for field, value in data.items():
            setattr(instance, field, value)

        if archivo:
            instance.documento_adjunto = _save_upload(archivo, 'incapacidades')

        instance.save()
        return Response(HorariosIncapacidadReadSerializer(instance, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def catalogo_docentes(self, request):
        if not _es_admin(request.user):
            raise PermissionDenied('Solo administracion puede listar docentes')

        personas_ids = AuthUsuarioRol.objects.filter(
            usuario__is_active=True,
            usuario__persona__activo=True,
            rol__tipo_rol='docente',
        ).values_list('usuario__persona_id', flat=True).distinct()

        docentes_ids = []
        for persona_id in personas_ids:
            docente = _asegurar_docente_por_persona_id(persona_id)
            if docente:
                docentes_ids.append(docente.pk)

        docentes = PersonasDocente.objects.select_related('persona').filter(
            pk__in=docentes_ids,
            persona__activo=True,
        ).exclude(
            estado_laboral__iexact='inactivo'
        ).filter(
            Q(fecha_salida__isnull=True) | Q(fecha_salida__gte=timezone.localdate())
        ).order_by('persona__nombre', 'persona__primer_apellido')
        data = []
        for docente in docentes:
            persona = docente.persona
            nombre = str(docente)
            data.append({
                'id': docente.persona_id,
                'nombre': nombre,
                'identificacion': getattr(persona, 'identificacion', None),
            })
        return Response(data)

