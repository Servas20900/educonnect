from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from apps.databaseModels.validators import validar_extension_archivo
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone


class AcademicoAsignatura(models.Model):
    id = models.BigAutoField(primary_key=True)
    codigo = models.CharField(unique=True, max_length=50)
    nombre = models.CharField(max_length=200)
    area = models.CharField(max_length=50)
    descripcion = models.TextField()
    horas_semanales = models.IntegerField()
    activo = models.BooleanField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table = 'academico_asignatura'


class AcademicoAsignaturaGrado(models.Model):
    id = models.BigAutoField(primary_key=True)
    asignatura = models.ForeignKey(AcademicoAsignatura, models.SET_NULL, null=True)
    grado = models.ForeignKey('AcademicoGrado', models.SET_NULL, null=True)
    horas_semanales = models.IntegerField()
    obligatoria = models.BooleanField()

    class Meta:
        managed = True
        db_table = 'academico_asignatura_grado'
        unique_together = (('asignatura', 'grado'),)


class AcademicoDocenteGrupo(models.Model):
    id = models.BigAutoField(primary_key=True)
    docente = models.ForeignKey('PersonasDocente', models.SET_NULL, null=True)
    grupo = models.ForeignKey('AcademicoGrupo', models.SET_NULL, null=True)
    asignatura = models.ForeignKey(AcademicoAsignatura, models.SET_NULL, null=True)
    horas_semanales = models.IntegerField()
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(blank=True, null=True)
    activo = models.BooleanField()
    fecha_asignacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'academico_docente_grupo'
        unique_together = (('docente', 'grupo', 'asignatura'),)


class AcademicoGrado(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    nivel = models.CharField(max_length=20)
    numero_grado = models.IntegerField()
    descripcion = models.TextField()
    activo = models.BooleanField()

    class Meta:
        managed = True
        db_table = 'academico_grado'
        unique_together = (('nivel', 'numero_grado'),)


class AcademicoGrupo(models.Model):
    id = models.BigAutoField(primary_key=True)
    periodo = models.ForeignKey('AcademicoPeriodo', models.SET_NULL, null=True)
    grado = models.ForeignKey(AcademicoGrado, models.SET_NULL, null=True)
    seccion = models.ForeignKey('AcademicoSeccion', models.SET_NULL, null=True)
    docente_guia = models.ForeignKey('PersonasDocente', models.SET_NULL, blank=True, null=True)
    nombre = models.CharField(max_length=200)
    codigo_grupo = models.CharField(unique=True, max_length=50)
    aula = models.CharField(max_length=50)
    estado = models.CharField(max_length=20, db_index=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table = 'academico_grupo'
        unique_together = (('periodo', 'grado', 'seccion'),)
        indexes = [
            models.Index(fields=['periodo', 'estado'], name='idx_grupo_periodo_estado'),
        ]

    def __str__(self):
        return f"{self.seccion}"


class AcademicoMatricula(models.Model):
    id = models.BigAutoField(primary_key=True)
    estudiante = models.ForeignKey('PersonasEstudiante', models.SET_NULL, null=True)
    grupo = models.ForeignKey(AcademicoGrupo, models.SET_NULL, null=True)
    fecha_matricula = models.DateField()
    fecha_retiro = models.DateField(blank=True, null=True)
    estado = models.CharField(max_length=20, db_index=True)
    observaciones = models.TextField()

    class Meta:
        managed = True
        db_table = 'academico_matricula'
        unique_together = (('estudiante', 'grupo'),)


class AcademicoPeriodo(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    año_lectivo = models.IntegerField(db_index=True)
    tipo_periodo = models.CharField(max_length=20)
    numero_periodo = models.IntegerField()
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    estado = models.CharField(max_length=20, db_index=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table = 'academico_periodo'
        unique_together = (('año_lectivo', 'tipo_periodo', 'numero_periodo'),)

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.fecha_inicio and self.fecha_fin and self.fecha_inicio >= self.fecha_fin:
            raise ValidationError({'fecha_fin': 'La fecha de fin debe ser posterior a la fecha de inicio.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class AcademicoSeccion(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=50)
    codigo = models.CharField(unique=True, max_length=10)
    descripcion = models.TextField()
    capacidad_maxima = models.IntegerField()
    activo = models.BooleanField()

    class Meta:
        managed = True
        db_table = 'academico_seccion'


class AuthAuditoriaLog(models.Model):
    id = models.BigAutoField(primary_key=True)
    usuario = models.ForeignKey('AuthUsuario', models.SET_NULL, blank=True, null=True)
    accion = models.CharField(max_length=100, db_index=True)
    modulo = models.CharField(max_length=50, db_index=True)
    descripcion = models.TextField()
    tabla_afectada = models.CharField(max_length=100)
    registro_id = models.CharField(max_length=100)
    resultado = models.CharField(max_length=20)
    mensaje_error = models.TextField(blank=True, null=True)
    datos_anteriores = models.JSONField(blank=True, null=True)
    datos_nuevos = models.JSONField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    fecha_hora = models.DateTimeField(db_index=True)

    class Meta:
        managed = True
        db_table = 'auth_auditoria_log'
        indexes = [
            models.Index(fields=['usuario', 'fecha_hora'], name='idx_auditoria_usuario_fecha'),
            models.Index(fields=['modulo', 'accion'],      name='idx_auditoria_modulo_accion'),
        ]


class AuthPermiso(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(unique=True, max_length=100)
    descripcion = models.TextField()
    modulo = models.CharField(max_length=50)
    accion = models.CharField(max_length=20)
    activo = models.BooleanField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'auth_permiso'


class AuthRol(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(unique=True, max_length=100)
    descripcion = models.TextField()
    tipo_rol = models.CharField(max_length=20)
    activo = models.BooleanField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table = 'auth_rol'


class AuthRolPermiso(models.Model):
    id = models.BigAutoField(primary_key=True)
    rol = models.ForeignKey(AuthRol, models.SET_NULL, null=True)
    permiso = models.ForeignKey(AuthPermiso, models.SET_NULL, null=True)
    fecha_asignacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'auth_rol_permiso'
        unique_together = (('rol', 'permiso'),)


class AuthSesion(models.Model):
    id = models.BigAutoField(primary_key=True)
    usuario = models.ForeignKey('AuthUsuario', models.SET_NULL, null=True)
    token = models.CharField(unique=True, max_length=255)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    fecha_inicio = models.DateTimeField()
    fecha_expiracion = models.DateTimeField()
    fecha_ultimo_uso = models.DateTimeField()
    activa = models.BooleanField()

    class Meta:
        managed = True
        db_table = 'auth_sesion'
        indexes = [
            models.Index(fields=['activa', 'fecha_expiracion'], name='idx_sesion_activa_expiracion'),
        ]


class AuthUsuarioManager(BaseUserManager):
    def get_by_natural_key(self, username):
        return self.get(username=username)

    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El correo electrónico es obligatorio')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, email, password, **extra_fields)


class AuthUsuario(AbstractBaseUser, PermissionsMixin):
    id = models.BigAutoField(primary_key=True)
    username = models.CharField(unique=True, max_length=150)
    email = models.CharField(unique=True, max_length=255)
    password = models.CharField(max_length=128)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_ultimo_login = models.DateTimeField(blank=True, null=True)
    ultima_actualizacion_password = models.DateTimeField(blank=True, null=True)
    intentos_fallidos = models.IntegerField(default=0)
    bloqueado = models.BooleanField(default=False)
    fecha_bloqueo = models.DateTimeField(blank=True, null=True)
    motivo_bloqueo = models.TextField(blank=True, null=True)
    debe_cambiar_password = models.BooleanField(default=False)
    persona = models.OneToOneField('PersonasPersona', models.SET_NULL, blank=True, null=True)

    objects = AuthUsuarioManager()
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    class Meta:
        managed = True
        db_table = 'auth_usuario'

    def __str__(self):
        if self.persona:
            return f"{self.persona.nombre} {self.persona.primer_apellido}"
        return f"Usuario ID: {self.id} (Sin Persona asignada)"


class AuthUsuarioRol(models.Model):
    id = models.BigAutoField(primary_key=True)
    usuario = models.ForeignKey(AuthUsuario, models.SET_NULL, null=True)
    rol = models.ForeignKey(AuthRol, models.SET_NULL, null=True)
    fecha_asignacion = models.DateTimeField(auto_now_add=True)
    asignado_por = models.ForeignKey(
        AuthUsuario, models.SET_NULL,
        related_name='authusuariorol_asignado_por_set',
        blank=True, null=True,
    )

    class Meta:
        managed = True
        db_table = 'auth_usuario_rol'
        unique_together = (('usuario', 'rol'),)


class ComitesActa(models.Model):
    id = models.BigAutoField(primary_key=True)
    reunion = models.OneToOneField('ComitesReunion', models.SET_NULL, null=True)
    numero_acta = models.CharField(max_length=50)
    contenido = models.TextField()
    acuerdos = models.TextField()
    seguimientos = models.TextField()
    estado = models.CharField(max_length=20)
    elaborada_por = models.ForeignKey(AuthUsuario, models.SET_NULL, null=True)
    aprobada_por = models.ForeignKey(
        AuthUsuario, models.SET_NULL,
        related_name='comitesacta_aprobada_por_set',
        blank=True, null=True,
    )
    fecha_elaboracion = models.DateTimeField(auto_now_add=True)
    fecha_aprobacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'comites_acta'


class ComitesComite(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=200)
    tipo_comite = models.CharField(max_length=50)
    descripcion = models.TextField()
    objetivos = models.TextField()
    periodo = models.ForeignKey(AcademicoPeriodo, models.SET_NULL, blank=True, null=True)
    fecha_creacion = models.DateField()
    fecha_disolucion = models.DateField(blank=True, null=True)
    estado = models.CharField(max_length=20)
    reglamento = models.TextField()

    class Meta:
        managed = True
        db_table = 'comites_comite'


class ComitesInformeOrgano(models.Model):
    id = models.BigAutoField(primary_key=True)
    organo = models.ForeignKey('ComitesOrganoAuxiliar', models.SET_NULL, null=True)
    periodo = models.ForeignKey(AcademicoPeriodo, models.SET_NULL, null=True)
    tipo_informe = models.CharField(max_length=50)
    titulo = models.CharField(max_length=200)
    contenido = models.TextField()
    conclusiones = models.TextField()
    recomendaciones = models.TextField()
    archivo_adjunto = models.FileField(
        upload_to='comites/informes/',
        blank=True, null=True,
        validators=[validar_extension_archivo],
    )
    elaborado_por = models.ForeignKey(AuthUsuario, models.SET_NULL, null=True)
    fecha_elaboracion = models.DateField()
    fecha_presentacion = models.DateField(blank=True, null=True)
    estado = models.CharField(max_length=20)

    class Meta:
        managed = True
        db_table = 'comites_informe_organo'


class ComitesMiembro(models.Model):
    id = models.BigAutoField(primary_key=True)
    comite = models.ForeignKey(ComitesComite, models.SET_NULL, null=True)
    persona = models.ForeignKey('PersonasPersona', models.SET_NULL, null=True)
    cargo = models.CharField(max_length=100)
    fecha_nombramiento = models.DateField()
    fecha_cese = models.DateField(blank=True, null=True)
    activo = models.BooleanField()

    class Meta:
        managed = True
        db_table = 'comites_miembro'
        unique_together = (('comite', 'persona'),)


class ComitesOrganoAuxiliar(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=200)
    tipo_organo = models.CharField(max_length=50)
    descripcion = models.TextField()
    periodo = models.ForeignKey(AcademicoPeriodo, models.SET_NULL, blank=True, null=True)
    coordinador = models.ForeignKey('PersonasPersona', models.SET_NULL, blank=True, null=True)
    fecha_creacion = models.DateField()
    estado = models.CharField(max_length=20)

    class Meta:
        managed = True
        db_table = 'comites_organo_auxiliar'


class ComitesReunion(models.Model):
    id = models.BigAutoField(primary_key=True)
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField(blank=True, null=True)
    tema = models.TextField()
    asistentes = models.JSONField()
    convocada_por = models.ForeignKey(AuthUsuario, models.SET_NULL, null=True)
    estado = models.CharField(max_length=20)
    fecha_convocatoria = models.DateTimeField(auto_now_add=True)
    lugar = models.CharField(max_length=200)

    class Meta:
        managed = True
        db_table = 'comites_reunion'


DESTINATARIOS_CHOICES = [
    ('docentes', 'Docentes'),
    ('estudiantes', 'Estudiantes'),
    ('todos', 'Todos'),
]

CIRCULAR_ESTADO_CHOICES = [
    ('activa', 'Activa'),
    ('archivada', 'Archivada'),
]


class ComunicacionesCircular(models.Model):
    id = models.BigAutoField(primary_key=True)
    titulo = models.CharField(max_length=200, db_index=True)
    contenido = models.TextField()
    detalle = models.TextField(blank=True, null=True)
    destinatarios = models.CharField(
        max_length=20, choices=DESTINATARIOS_CHOICES, default='todos', db_index=True,
    )
    visible = models.BooleanField(default=True)
    archivo_adjunto = models.FileField(
        upload_to='circulares/',
        null=True, blank=True,
        validators=[validar_extension_archivo],
    )
    fecha_vigencia_inicio = models.DateField(db_index=True)
    fecha_vigencia_fin = models.DateField(blank=True, null=True)
    estado = models.CharField(max_length=20, choices=CIRCULAR_ESTADO_CHOICES, default='activa', db_index=True)
    categoria = models.CharField(max_length=100, db_index=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True, db_index=True)
    creada_por = models.ForeignKey(AuthUsuario, models.SET_NULL, null=True, related_name='circulares_creadas')

    class Meta:
        managed = True
        db_table = 'comunicaciones_circular'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['estado', 'fecha_vigencia_inicio'], name='idx_circular_estado_vigencia'),
            models.Index(fields=['destinatarios', 'estado'],         name='idx_circular_dest_estado'),
        ]

    def __str__(self):
        return f"[{self.estado}] {self.titulo}"


class ComunicacionesComunicado(models.Model):
    TIPO_COMUNICADO_CHOICES = [
        ('informativo', 'Informativo'),
        ('urgente', 'Urgente'),
        ('evento', 'Evento'),
        ('aviso', 'Aviso'),
        ('felicitacion', 'Felicitación'),
        ('tarea', 'Tarea'),
        ('cambio', 'Cambio'),
    ]

    id = models.BigAutoField(primary_key=True)
    titulo = models.CharField(max_length=200)
    contenido = models.TextField()
    tipo_comunicado = models.CharField(
        max_length=50, choices=TIPO_COMUNICADO_CHOICES, default='informativo', db_index=True,
    )
    destinatarios = models.JSONField(default=list)
    fecha_publicacion = models.DateTimeField(default=timezone.now, db_index=True)
    fecha_vigencia = models.DateTimeField(blank=True, null=True)
    visible = models.BooleanField(default=True, db_index=True)
    publicado_por = models.ForeignKey(AuthUsuario, models.SET_NULL, null=True)

    class Meta:
        managed = True
        db_table = 'comunicaciones_comunicado'
        ordering = ['-fecha_publicacion']


class ComunicacionesLecturaCircular(models.Model):
    id = models.BigAutoField(primary_key=True)
    circular = models.ForeignKey(ComunicacionesCircular, models.SET_NULL, null=True)
    persona = models.ForeignKey('PersonasPersona', models.SET_NULL, null=True)
    fecha_lectura = models.DateTimeField()
    confirmada = models.BooleanField()
    fecha_confirmacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'comunicaciones_lectura_circular'
        unique_together = (('circular', 'persona'),)


class ComunicacionesNotificacion(models.Model):
    id = models.BigAutoField(primary_key=True)
    usuario = models.ForeignKey(AuthUsuario, models.SET_NULL, null=True)
    tipo_notificacion = models.CharField(max_length=50, db_index=True)
    titulo = models.CharField(max_length=200)
    mensaje = models.TextField()
    enlace = models.CharField(max_length=500)
    leida = models.BooleanField(db_index=True)
    fecha_lectura = models.DateTimeField(blank=True, null=True)
    prioridad = models.CharField(max_length=20)
    fecha_creacion = models.DateTimeField(db_index=True)
    fecha_expiracion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'comunicaciones_notificacion'
        indexes = [
            models.Index(fields=['usuario', 'leida'],          name='idx_notif_usuario_leida'),
            models.Index(fields=['usuario', 'fecha_creacion'], name='idx_notif_usuario_fecha'),
        ]


class ComunicacionMaterial(models.Model):
    titulo = models.CharField(max_length=255)
    archivo = models.FileField(
        upload_to='comunicaciones/materiales/',
        validators=[validar_extension_archivo],
    )
    fecha_subida = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'comunicaciones_material'
        verbose_name = 'Material de Comunicación'

    def __str__(self):
        return self.titulo


class DocumentosCompartido(models.Model):
    id = models.BigAutoField(primary_key=True)
    documento = models.ForeignKey('DocumentosDocumento', models.SET_NULL, null=True)
    compartido_con_tipo = models.CharField(max_length=20)
    compartido_con_id = models.BigIntegerField()
    permisos = models.CharField(max_length=20)
    fecha_compartido = models.DateTimeField()
    compartido_por = models.ForeignKey(AuthUsuario, models.SET_NULL, null=True)
    fecha_expiracion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'documentos_compartido'


class DocumentosDocumento(models.Model):
    id = models.BigAutoField(primary_key=True)
    repositorio = models.ForeignKey('DocumentosRepositorio', models.SET_NULL, null=True)
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField()
    tipo_documento = models.CharField(max_length=50)
    ruta_archivo = models.CharField(max_length=500)
    tamaño_bytes = models.BigIntegerField()
    extension = models.CharField(max_length=10)
    mime_type = models.CharField(max_length=100)
    version = models.IntegerField()
    documento_anterior = models.ForeignKey('self', models.SET_NULL, blank=True, null=True)
    hash_md5 = models.CharField(max_length=32)
    es_version_actual = models.BooleanField()
    etiquetas = models.JSONField()
    metadatos = models.JSONField()
    fecha_documento = models.DateField(blank=True, null=True)
    fecha_carga = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)
    cargado_por = models.ForeignKey(AuthUsuario, models.SET_NULL, null=True)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        managed = True
        db_table = 'documentos_documento'
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
        ]


class DocumentosPlantilla(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    tipo_documento = models.CharField(max_length=50)
    contenido_plantilla = models.TextField()
    variables = models.JSONField()
    categoria = models.CharField(max_length=50)
    activa = models.BooleanField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    creada_por = models.ForeignKey(AuthUsuario, models.SET_NULL, null=True)

    class Meta:
        managed = True
        db_table = 'documentos_plantilla'


class DocumentosRepositorio(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    cloudinary_path = models.CharField(max_length=500, unique=True)
    rol_acceso = models.CharField(max_length=50, default='Administrador')
    puede_escribir = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)
    creado_por = models.ForeignKey(AuthUsuario, on_delete=models.SET_NULL, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'documentos_repositorio'


class EvaluacionesAsistencia(models.Model):
    id = models.BigAutoField(primary_key=True)
    estudiante = models.ForeignKey('PersonasEstudiante', models.SET_NULL, null=True)
    grupo = models.ForeignKey(AcademicoGrupo, models.SET_NULL, null=True)
    fecha = models.DateField()
    hora = models.TimeField()
    estado = models.CharField(max_length=20)
    justificada = models.BooleanField()
    motivo = models.TextField()
    documento_adjunto = models.FileField(
        upload_to='asistencia/documentos/',
        blank=True, null=True,
        validators=[validar_extension_archivo],
    )
    registrada_por = models.ForeignKey(AuthUsuario, models.SET_NULL, null=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'evaluaciones_asistencia'
        unique_together = (('estudiante', 'grupo', 'fecha', 'hora'),)
        indexes = [
            models.Index(fields=['grupo', 'fecha'], name='idx_asistencia_grupo_fecha'),
        ]


class EvaluacionesCalificacion(models.Model):
    id = models.BigAutoField(primary_key=True)
    evaluacion = models.ForeignKey('EvaluacionesEvaluacion', models.SET_NULL, null=True)
    estudiante = models.ForeignKey('PersonasEstudiante', models.SET_NULL, null=True)
    nota = models.DecimalField(max_digits=5, decimal_places=2)
    estado = models.CharField(max_length=20)
    ausente = models.BooleanField()
    justificado = models.BooleanField()
    observaciones = models.TextField()
    fecha_registro = models.DateTimeField(auto_now_add=True, db_index=True)
    registrada_por = models.ForeignKey(AuthUsuario, models.SET_NULL, null=True)

    class Meta:
        managed = True
        db_table = 'evaluaciones_calificacion'
        unique_together = (('evaluacion', 'estudiante'),)
        indexes = [
            models.Index(fields=['estudiante', 'fecha_registro'], name='idx_calificacion_est_fecha'),
        ]


class EvaluacionesEvaluacion(models.Model):
    id = models.BigAutoField(primary_key=True)
    docente_grupo = models.ForeignKey(AcademicoDocenteGrupo, models.SET_NULL, null=True)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    tipo_evaluacion = models.CharField(max_length=50, db_index=True)
    fecha_evaluacion = models.DateField(db_index=True)
    fecha_entrega = models.DateField(blank=True, null=True)
    valor_porcentual = models.DecimalField(max_digits=5, decimal_places=2)
    nota_maxima = models.DecimalField(max_digits=5, decimal_places=2)
    rubrica = models.JSONField(blank=True, null=True)
    instrucciones = models.TextField()
    visible_estudiantes = models.BooleanField()
    permite_recuperacion = models.BooleanField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table = 'evaluaciones_evaluacion'
        indexes = [
            models.Index(fields=['docente_grupo', 'fecha_evaluacion'], name='idx_eval_docgrp_fecha'),
        ]

    def clean(self):
        from django.core.exceptions import ValidationError
        errors = {}
        if self.valor_porcentual is not None and not (0 < self.valor_porcentual <= 100):
            errors['valor_porcentual'] = 'El valor porcentual debe estar entre 0.01 y 100.'
        if self.nota_maxima is not None and self.nota_maxima <= 0:
            errors['nota_maxima'] = 'La nota máxima debe ser mayor a 0.'
        if self.fecha_evaluacion and self.fecha_entrega and self.fecha_entrega < self.fecha_evaluacion:
            errors['fecha_entrega'] = 'La fecha de entrega no puede ser anterior a la fecha de evaluación.'
        if errors:
            raise ValidationError(errors)


class EvaluacionesHistorialCalificacion(models.Model):
    id = models.BigAutoField(primary_key=True)
    calificacion = models.ForeignKey(EvaluacionesCalificacion, models.SET_NULL, null=True)
    nota_anterior = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    nota_nueva = models.DecimalField(max_digits=5, decimal_places=2)
    motivo_cambio = models.TextField()
    modificada_por = models.ForeignKey(AuthUsuario, models.SET_NULL, null=True)
    fecha_modificacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'evaluaciones_historial_calificacion'


class EvaluacionesPromedio(models.Model):
    id = models.BigAutoField(primary_key=True)
    estudiante = models.ForeignKey('PersonasEstudiante', models.SET_NULL, null=True)
    docente_grupo = models.ForeignKey(AcademicoDocenteGrupo, models.SET_NULL, null=True)
    periodo = models.ForeignKey(AcademicoPeriodo, models.SET_NULL, null=True)
    promedio = models.DecimalField(max_digits=5, decimal_places=2)
    total_ausencias = models.IntegerField()
    total_tardias = models.IntegerField()
    notas_adicionales = models.TextField()
    fecha_calculo = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'evaluaciones_promedio'
        unique_together = (('estudiante', 'docente_grupo', 'periodo'),)


class HorariosAprobacion(models.Model):
    id = models.BigAutoField(primary_key=True)
    horario = models.ForeignKey('HorariosHorario', models.SET_NULL, null=True)
    aprobador = models.ForeignKey(AuthUsuario, models.SET_NULL, null=True)
    nivel_aprobacion = models.IntegerField()
    estado_aprobacion = models.CharField(max_length=20)
    fecha_revision = models.DateTimeField()
    fecha_decision = models.DateTimeField(blank=True, null=True)
    comentarios = models.TextField()

    class Meta:
        managed = True
        db_table = 'horarios_aprobacion'
        unique_together = (('horario', 'nivel_aprobacion'),)


class HorariosDetalle(models.Model):
    id = models.BigAutoField(primary_key=True)
    horario = models.ForeignKey('HorariosHorario', models.SET_NULL, null=True)
    dia_semana = models.CharField(max_length=15)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    asignatura = models.ForeignKey(AcademicoAsignatura, models.SET_NULL, blank=True, null=True)
    docente = models.ForeignKey('PersonasDocente', models.SET_NULL, blank=True, null=True, related_name='detalles_horario')
    aula = models.CharField(max_length=50)
    notas = models.TextField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'horarios_detalle'


class HorariosHorario(models.Model):
    id = models.BigAutoField(primary_key=True)
    grupo = models.ForeignKey(AcademicoGrupo, models.SET_NULL, blank=True, null=True)
    docente = models.ForeignKey('PersonasDocente', models.SET_NULL, blank=True, null=True, related_name='horarios_asignados')
    nombre = models.CharField(max_length=200)
    tipo_horario = models.CharField(max_length=20, blank=True, null=True)
    version = models.IntegerField()
    horario_anterior = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True, related_name='sucesores')
    estado = models.CharField(max_length=20, db_index=True)
    fecha_vigencia_inicio = models.DateField(blank=True, null=True)
    fecha_vigencia_fin = models.DateField(blank=True, null=True)
    notas = models.TextField(blank=True, null=True)
    creado_por = models.ForeignKey(AuthUsuario, models.SET_NULL, null=True, related_name='horarios_creados')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table = 'horarios_horario'


class HorariosIncapacidad(models.Model):
    id = models.BigAutoField(primary_key=True)
    docente = models.ForeignKey('PersonasDocente', models.SET_NULL, null=True)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    tipo = models.CharField(max_length=30, default='incapacidad')
    estado = models.CharField(max_length=20, default='aprobada')
    motivo = models.TextField()
    numero_documento = models.CharField(max_length=50)
    documento_adjunto = models.FileField(
        upload_to='horarios/incapacidades/',
        blank=True, null=True,
        validators=[validar_extension_archivo],
    )
    institucion_emisora = models.CharField(max_length=200)
    registrada_por = models.ForeignKey(AuthUsuario, models.SET_NULL, null=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_creacion = models.DateField(auto_now_add=True)
    revisada_por = models.ForeignKey(
        AuthUsuario, models.SET_NULL,
        related_name='horariosincapacidad_revisada_por_set',
        blank=True, null=True,
    )
    fecha_revision = models.DateTimeField(blank=True, null=True)
    comentario_revision = models.TextField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'horarios_incapacidad'


class HorariosPermiso(models.Model):
    id = models.BigAutoField(primary_key=True)
    docente = models.ForeignKey('PersonasDocente', models.SET_NULL, null=True)
    tipo_permiso = models.CharField(max_length=50)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    hora_inicio = models.TimeField(blank=True, null=True)
    hora_fin = models.TimeField(blank=True, null=True)
    motivo = models.TextField()
    estado = models.CharField(max_length=20)
    solicitado_por = models.ForeignKey(AuthUsuario, models.SET_NULL, null=True)
    aprobado_por = models.ForeignKey(
        AuthUsuario, models.SET_NULL,
        related_name='horariospermiso_aprobado_por_set',
        blank=True, null=True,
    )
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_aprobacion = models.DateTimeField(blank=True, null=True)
    comentarios_aprobacion = models.TextField()

    class Meta:
        managed = True
        db_table = 'horarios_permiso'


class PersonasDocente(models.Model):
    persona = models.OneToOneField('PersonasPersona', models.CASCADE, primary_key=True)
    codigo_empleado = models.CharField(unique=True, max_length=50)
    especialidad = models.CharField(max_length=100)
    nivel_academico = models.CharField(max_length=50)
    fecha_ingreso = models.DateField()
    fecha_salida = models.DateField(blank=True, null=True)
    estado_laboral = models.CharField(max_length=20)
    tipo_contrato = models.CharField(max_length=20)
    horas_contratadas = models.IntegerField()
    salario_base = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    numero_cuenta_bancaria = models.CharField(max_length=50)
    titulo_profesional = models.CharField(max_length=200)
    universidad = models.CharField(max_length=200)
    año_graduacion = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'personas_docente'

    def __str__(self):
        if self.persona:
            return f"{self.persona.nombre} {self.persona.primer_apellido}"
        return f"Docente ID: {self.persona_id} (Sin Persona asignada)"


class PersonasEncargado(models.Model):
    persona = models.OneToOneField('PersonasPersona', models.CASCADE, primary_key=True)
    parentesco = models.CharField(max_length=50)
    ocupacion = models.CharField(max_length=100)
    lugar_trabajo = models.CharField(max_length=200)
    telefono_trabajo = models.CharField(max_length=20)
    es_responsable_economico = models.BooleanField()
    es_contacto_emergencia = models.BooleanField()
    nivel_educativo = models.CharField(max_length=50)

    class Meta:
        managed = True
        db_table = 'personas_encargado'


class PersonasEstudiante(models.Model):
    persona = models.OneToOneField('PersonasPersona', models.CASCADE, primary_key=True)
    codigo_estudiante = models.CharField(unique=True, max_length=50)
    fecha_ingreso = models.DateField()
    fecha_retiro = models.DateField(blank=True, null=True)
    estado_estudiante = models.CharField(max_length=20)
    tipo_estudiante = models.CharField(max_length=20)
    condicion_especial = models.CharField(max_length=50)
    beca = models.BooleanField()
    tipo_beca = models.CharField(max_length=50)
    porcentaje_beca = models.DecimalField(max_digits=5, decimal_places=2)
    tiene_adecuacion = models.BooleanField()
    tipo_adecuacion = models.CharField(max_length=50)

    class Meta:
        managed = True
        db_table = 'personas_estudiante'


class PersonasEstudianteEncargado(models.Model):
    id = models.BigAutoField(primary_key=True)
    estudiante = models.ForeignKey(PersonasEstudiante, models.SET_NULL, null=True)
    encargado = models.ForeignKey(PersonasEncargado, models.SET_NULL, null=True)
    tipo_relacion = models.CharField(max_length=50)
    prioridad = models.IntegerField()
    fecha_asignacion = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField()

    class Meta:
        managed = True
        db_table = 'personas_estudiante_encargado'
        unique_together = (('estudiante', 'encargado'),)


class PersonasPersona(models.Model):
    id = models.BigAutoField(primary_key=True)
    identificacion = models.CharField(unique=True, max_length=20)
    tipo_identificacion = models.CharField(max_length=20)
    nombre = models.CharField(max_length=100)
    primer_apellido = models.CharField(max_length=100)
    segundo_apellido = models.CharField(max_length=100)
    fecha_nacimiento = models.DateField()
    genero = models.CharField(max_length=20)
    nacionalidad = models.CharField(max_length=50)
    telefono_principal = models.CharField(max_length=20)
    telefono_secundario = models.CharField(max_length=20)
    email_personal = models.CharField(max_length=255)
    email_institucional = models.CharField(max_length=255, db_index=True)
    direccion_exacta = models.TextField()
    provincia = models.CharField(max_length=50)
    canton = models.CharField(max_length=50)
    distrito = models.CharField(max_length=50)
    fotografia = models.CharField(max_length=255, blank=True, null=True)
    estado_civil = models.CharField(max_length=20)
    notas = models.TextField()
    activo = models.BooleanField(default=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)
    creado_por = models.ForeignKey(AuthUsuario, models.SET_NULL, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'personas_persona'
