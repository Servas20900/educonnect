# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = True` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class AcademicoAsignatura(models.Model):
    id = models.BigAutoField(primary_key=True)
    codigo = models.CharField(unique=True, max_length=50)
    nombre = models.CharField(max_length=200)
    area = models.CharField(max_length=50)
    descripcion = models.TextField()
    horas_semanales = models.IntegerField()
    activo = models.BooleanField()
    fecha_creacion = models.DateTimeField()
    fecha_modificacion = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'academico_asignatura'


class AcademicoAsignaturaGrado(models.Model):
    id = models.BigAutoField(primary_key=True)
    asignatura = models.ForeignKey(AcademicoAsignatura, models.SET_NULL , null=True )
    grado = models.ForeignKey('AcademicoGrado', models.SET_NULL , null=True )
    horas_semanales = models.IntegerField()
    obligatoria = models.BooleanField()

    class Meta:
        managed = True
        db_table = 'academico_asignatura_grado'
        unique_together = (('asignatura', 'grado'),)


class AcademicoDocenteGrupo(models.Model):
    id = models.BigAutoField(primary_key=True)
    docente = models.ForeignKey('PersonasDocente', models.SET_NULL , null=True )
    grupo = models.ForeignKey('AcademicoGrupo', models.SET_NULL , null=True )
    asignatura = models.ForeignKey(AcademicoAsignatura, models.SET_NULL , null=True )
    horas_semanales = models.IntegerField()
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(blank=True, null=True)
    activo = models.BooleanField()
    fecha_asignacion = models.DateTimeField()

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
    periodo = models.ForeignKey('AcademicoPeriodo', models.SET_NULL , null=True )
    grado = models.ForeignKey(AcademicoGrado, models.SET_NULL , null=True )
    seccion = models.ForeignKey('AcademicoSeccion', models.SET_NULL , null=True )
    docente_guia = models.ForeignKey('PersonasDocente', models.SET_NULL , blank=True, null=True)
    nombre = models.CharField(max_length=200)
    codigo_grupo = models.CharField(unique=True, max_length=50)
    aula = models.CharField(max_length=50)
    estado = models.CharField(max_length=20)
    fecha_creacion = models.DateTimeField()
    fecha_modificacion = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'academico_grupo'
        unique_together = (('periodo', 'grado', 'seccion'),)


class AcademicoMatricula(models.Model):
    id = models.BigAutoField(primary_key=True)
    estudiante = models.ForeignKey('PersonasEstudiante', models.SET_NULL , null=True )
    grupo = models.ForeignKey(AcademicoGrupo, models.SET_NULL , null=True )
    fecha_matricula = models.DateField()
    fecha_retiro = models.DateField(blank=True, null=True)
    estado = models.CharField(max_length=20)
    observaciones = models.TextField()

    class Meta:
        managed = True
        db_table = 'academico_matricula'
        unique_together = (('estudiante', 'grupo'),)


class AcademicoPeriodo(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    año_lectivo = models.IntegerField()
    tipo_periodo = models.CharField(max_length=20)
    numero_periodo = models.IntegerField()
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    estado = models.CharField(max_length=20)
    fecha_creacion = models.DateTimeField()
    fecha_modificacion = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'academico_periodo'
        unique_together = (('año_lectivo', 'tipo_periodo', 'numero_periodo'),)


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
    usuario = models.ForeignKey('AuthUsuario', models.SET_NULL , blank=True, null=True)
    accion = models.CharField(max_length=100)
    modulo = models.CharField(max_length=50)
    descripcion = models.TextField()
    tabla_afectada = models.CharField(max_length=100)
    registro_id = models.CharField(max_length=100)
    resultado = models.CharField(max_length=20)
    mensaje_error = models.TextField()
    datos_anteriores = models.JSONField(blank=True, null=True)
    datos_nuevos = models.JSONField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField()
    fecha_hora = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'auth_auditoria_log'


class AuthPermiso(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(unique=True, max_length=100)
    descripcion = models.TextField()
    modulo = models.CharField(max_length=50)
    accion = models.CharField(max_length=20)
    activo = models.BooleanField()
    fecha_creacion = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'auth_permiso'


class AuthRol(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(unique=True, max_length=100)
    descripcion = models.TextField()
    tipo_rol = models.CharField(max_length=20)
    activo = models.BooleanField()
    fecha_creacion = models.DateTimeField()
    fecha_modificacion = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'auth_rol'


class AuthRolPermiso(models.Model):
    id = models.BigAutoField(primary_key=True)
    rol = models.ForeignKey(AuthRol, models.SET_NULL , null=True )
    permiso = models.ForeignKey(AuthPermiso, models.SET_NULL , null=True )
    fecha_asignacion = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'auth_rol_permiso'
        unique_together = (('rol', 'permiso'),)


class AuthSesion(models.Model):
    id = models.BigAutoField(primary_key=True)
    usuario = models.ForeignKey('AuthUsuario', models.SET_NULL , null=True )
    token = models.CharField(unique=True, max_length=255)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField()
    fecha_inicio = models.DateTimeField()
    fecha_expiracion = models.DateTimeField()
    fecha_ultimo_uso = models.DateTimeField()
    activa = models.BooleanField()

    class Meta:
        managed = True
        db_table = 'auth_sesion'


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
    persona = models.OneToOneField('PersonasPersona', models.SET_NULL , blank=True, null=True)
    
    objects = AuthUsuarioManager()
    USERNAME_FIELD = 'username' 
    REQUIRED_FIELDS = ['email']

    class Meta:
        managed = True
        db_table = 'auth_usuario'
    
    def __str__(self):
        return self.persona.nombre +" " +self.persona.primer_apellido 


class AuthUsuarioRol(models.Model):
    id = models.BigAutoField(primary_key=True)
    usuario = models.ForeignKey(AuthUsuario, models.SET_NULL , null=True )
    rol = models.ForeignKey(AuthRol, models.SET_NULL , null=True )
    fecha_asignacion = models.DateTimeField()
    asignado_por = models.ForeignKey(AuthUsuario, models.SET_NULL , related_name='authusuariorol_asignado_por_set', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'auth_usuario_rol'
        unique_together = (('usuario', 'rol'),)


class ComitesActa(models.Model):
    id = models.BigAutoField(primary_key=True)
    reunion = models.OneToOneField('ComitesReunion', models.SET_NULL , null=True )
    numero_acta = models.CharField(max_length=50)
    contenido = models.TextField()
    acuerdos = models.TextField()
    seguimientos = models.TextField()
    estado = models.CharField(max_length=20)
    elaborada_por = models.ForeignKey(AuthUsuario, models.SET_NULL , null=True )
    aprobada_por = models.ForeignKey(AuthUsuario, models.SET_NULL , related_name='comitesacta_aprobada_por_set', blank=True, null=True)
    fecha_elaboracion = models.DateTimeField()
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
    periodo = models.ForeignKey(AcademicoPeriodo, models.SET_NULL , blank=True, null=True)
    fecha_creacion = models.DateField()
    fecha_disolucion = models.DateField(blank=True, null=True)
    estado = models.CharField(max_length=20)
    reglamento = models.TextField()

    class Meta:
        managed = True
        db_table = 'comites_comite'


class ComitesInformeOrgano(models.Model):
    id = models.BigAutoField(primary_key=True)
    organo = models.ForeignKey('ComitesOrganoAuxiliar', models.SET_NULL , null=True )
    periodo = models.ForeignKey(AcademicoPeriodo, models.SET_NULL , null=True )
    tipo_informe = models.CharField(max_length=50)
    titulo = models.CharField(max_length=200)
    contenido = models.TextField()
    conclusiones = models.TextField()
    recomendaciones = models.TextField()
    archivo_adjunto = models.CharField(max_length=255, blank=True, null=True)
    elaborado_por = models.ForeignKey(AuthUsuario, models.SET_NULL , null=True )
    fecha_elaboracion = models.DateField()
    fecha_presentacion = models.DateField(blank=True, null=True)
    estado = models.CharField(max_length=20)

    class Meta:
        managed = True
        db_table = 'comites_informe_organo'


class ComitesMiembro(models.Model):
    id = models.BigAutoField(primary_key=True)
    comite = models.ForeignKey(ComitesComite, models.SET_NULL , null=True )
    persona = models.ForeignKey('PersonasPersona', models.SET_NULL , null=True )
    cargo = models.CharField(max_length=100)
    fecha_nombramiento = models.DateField()
    fecha_cese = models.DateField(blank=True, null=True)
    activo = models.BooleanField()

    class Meta:
        managed = True
        db_table = 'comites_miembro'
        unique_together = (('comite', 'persona', 'cargo'),)


class ComitesOrganoAuxiliar(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=200)
    tipo_organo = models.CharField(max_length=50)
    descripcion = models.TextField()
    periodo = models.ForeignKey(AcademicoPeriodo, models.SET_NULL , blank=True, null=True)
    coordinador = models.ForeignKey('PersonasPersona', models.SET_NULL , blank=True, null=True)
    fecha_creacion = models.DateField()
    estado = models.CharField(max_length=20)

    class Meta:
        managed = True
        db_table = 'comites_organo_auxiliar'


class ComitesReunion(models.Model):
    id = models.BigAutoField(primary_key=True)
    comite = models.ForeignKey(ComitesComite, models.SET_NULL , null=True )
    numero_reunion = models.IntegerField()
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField(blank=True, null=True)
    lugar = models.CharField(max_length=200)
    modalidad = models.CharField(max_length=20)
    tema = models.TextField()
    convocada_por = models.ForeignKey(AuthUsuario, models.SET_NULL , null=True )
    asistentes = models.JSONField()
    estado = models.CharField(max_length=20)
    fecha_convocatoria = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'comites_reunion'
        unique_together = (('comite', 'numero_reunion'),)


class ComunicacionesCircular(models.Model):
    id = models.BigAutoField(primary_key=True)
    titulo = models.CharField(max_length=200)
    contenido = models.TextField()
    archivo_adjunto = models.CharField(max_length=255, blank=True, null=True)
    fecha_vigencia_inicio = models.DateField()
    fecha_vigencia_fin = models.DateField(blank=True, null=True)
    estado = models.CharField(max_length=100) 
    categoria = models.CharField(max_length=255) 
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    creada_por = models.ForeignKey(AuthUsuario, models.SET_NULL , null=True)

    class Meta:
        managed = True
        db_table = 'comunicaciones_circular'


class ComunicacionesComunicado(models.Model):
    id = models.BigAutoField(primary_key=True)
    titulo = models.CharField(max_length=200)
    contenido = models.TextField()
    tipo_comunicado = models.CharField(max_length=50)
    destinatarios = models.JSONField()
    fecha_publicacion = models.DateTimeField()
    fecha_vigencia = models.DateTimeField(blank=True, null=True)
    visible = models.BooleanField()
    publicado_por = models.ForeignKey(AuthUsuario, models.SET_NULL , null=True )

    class Meta:
        managed = True
        db_table = 'comunicaciones_comunicado'


class ComunicacionesLecturaCircular(models.Model):
    id = models.BigAutoField(primary_key=True)
    circular = models.ForeignKey(ComunicacionesCircular, models.SET_NULL , null=True )
    persona = models.ForeignKey('PersonasPersona', models.SET_NULL , null=True )
    fecha_lectura = models.DateTimeField()
    confirmada = models.BooleanField()
    fecha_confirmacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'comunicaciones_lectura_circular'
        unique_together = (('circular', 'persona'),)


class ComunicacionesNotificacion(models.Model):
    id = models.BigAutoField(primary_key=True)
    usuario = models.ForeignKey(AuthUsuario, models.SET_NULL , null=True )
    tipo_notificacion = models.CharField(max_length=50)
    titulo = models.CharField(max_length=200)
    mensaje = models.TextField()
    enlace = models.CharField(max_length=500)
    leida = models.BooleanField()
    fecha_lectura = models.DateTimeField(blank=True, null=True)
    prioridad = models.CharField(max_length=20)
    fecha_creacion = models.DateTimeField()
    fecha_expiracion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'comunicaciones_notificacion'


class DocumentosCompartido(models.Model):
    id = models.BigAutoField(primary_key=True)
    documento = models.ForeignKey('DocumentosDocumento', models.SET_NULL , null=True )
    compartido_con_tipo = models.CharField(max_length=20)
    compartido_con_id = models.BigIntegerField()
    permisos = models.CharField(max_length=20)
    fecha_compartido = models.DateTimeField()
    compartido_por = models.ForeignKey(AuthUsuario, models.SET_NULL , null=True )
    fecha_expiracion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'documentos_compartido'


class DocumentosDocumento(models.Model):
    id = models.BigAutoField(primary_key=True)
    repositorio = models.ForeignKey('DocumentosRepositorio', models.SET_NULL , null=True )
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField()
    tipo_documento = models.CharField(max_length=50)
    ruta_archivo = models.CharField(max_length=500)
    tamaño_bytes = models.BigIntegerField()
    extension = models.CharField(max_length=10)
    mime_type = models.CharField(max_length=100)
    version = models.IntegerField()
    documento_anterior = models.ForeignKey('self', models.SET_NULL , blank=True, null=True)
    hash_md5 = models.CharField(max_length=32)
    es_version_actual = models.BooleanField()
    etiquetas = models.JSONField()
    metadatos = models.JSONField()
    fecha_documento = models.DateField(blank=True, null=True)
    fecha_carga = models.DateTimeField()
    fecha_modificacion = models.DateTimeField()
    cargado_por = models.ForeignKey(AuthUsuario, models.SET_NULL , null=True )

    class Meta:
        managed = True
        db_table = 'documentos_documento'


class DocumentosPlantilla(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    tipo_documento = models.CharField(max_length=50)
    contenido_plantilla = models.TextField()
    variables = models.JSONField()
    categoria = models.CharField(max_length=50)
    activa = models.BooleanField()
    fecha_creacion = models.DateTimeField()
    creada_por = models.ForeignKey(AuthUsuario, models.SET_NULL , null=True )

    class Meta:
        managed = True
        db_table = 'documentos_plantilla'


class DocumentosRepositorio(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    padre = models.ForeignKey('self', models.SET_NULL , blank=True, null=True)
    tipo_contenido = models.CharField(max_length=50)
    permisos_lectura = models.JSONField()
    permisos_escritura = models.JSONField()
    es_publico = models.BooleanField()
    activo = models.BooleanField()
    fecha_creacion = models.DateTimeField()
    creado_por = models.ForeignKey(AuthUsuario, models.SET_NULL , null=True )

    class Meta:
        managed = True
        db_table = 'documentos_repositorio'


class EvaluacionesAsistencia(models.Model):
    id = models.BigAutoField(primary_key=True)
    estudiante = models.ForeignKey('PersonasEstudiante', models.SET_NULL , null=True )
    grupo = models.ForeignKey(AcademicoGrupo, models.SET_NULL , null=True )
    fecha = models.DateField()
    hora = models.TimeField()
    estado = models.CharField(max_length=20)
    justificada = models.BooleanField()
    motivo = models.TextField()
    documento_adjunto = models.CharField(max_length=255, blank=True, null=True)
    registrada_por = models.ForeignKey(AuthUsuario, models.SET_NULL , null=True )
    fecha_registro = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'evaluaciones_asistencia'
        unique_together = (('estudiante', 'grupo', 'fecha', 'hora'),)


class EvaluacionesCalificacion(models.Model):
    id = models.BigAutoField(primary_key=True)
    evaluacion = models.ForeignKey('EvaluacionesEvaluacion', models.SET_NULL , null=True )
    estudiante = models.ForeignKey('PersonasEstudiante', models.SET_NULL , null=True )
    nota = models.DecimalField(max_digits=5, decimal_places=2)
    estado = models.CharField(max_length=20)
    ausente = models.BooleanField()
    justificado = models.BooleanField()
    observaciones = models.TextField()
    fecha_registro = models.DateTimeField()
    registrada_por = models.ForeignKey(AuthUsuario, models.SET_NULL , null=True )

    class Meta:
        managed = True
        db_table = 'evaluaciones_calificacion'
        unique_together = (('evaluacion', 'estudiante'),)


class EvaluacionesEvaluacion(models.Model):
    id = models.BigAutoField(primary_key=True)
    docente_grupo = models.ForeignKey(AcademicoDocenteGrupo, models.SET_NULL , null=True )
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    tipo_evaluacion = models.CharField(max_length=50)
    fecha_evaluacion = models.DateField()
    fecha_entrega = models.DateField(blank=True, null=True)
    valor_porcentual = models.DecimalField(max_digits=5, decimal_places=2)
    nota_maxima = models.DecimalField(max_digits=5, decimal_places=2)
    rubrica = models.JSONField(blank=True, null=True)
    instrucciones = models.TextField()
    visible_estudiantes = models.BooleanField()
    permite_recuperacion = models.BooleanField()
    fecha_creacion = models.DateTimeField()
    fecha_modificacion = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'evaluaciones_evaluacion'


class EvaluacionesHistorialCalificacion(models.Model):
    id = models.BigAutoField(primary_key=True)
    calificacion = models.ForeignKey(EvaluacionesCalificacion, models.SET_NULL , null=True )
    nota_anterior = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    nota_nueva = models.DecimalField(max_digits=5, decimal_places=2)
    motivo_cambio = models.TextField()
    modificada_por = models.ForeignKey(AuthUsuario, models.SET_NULL , null=True )
    fecha_modificacion = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'evaluaciones_historial_calificacion'


class EvaluacionesPromedio(models.Model):
    id = models.BigAutoField(primary_key=True)
    estudiante = models.ForeignKey('PersonasEstudiante', models.SET_NULL , null=True )
    docente_grupo = models.ForeignKey(AcademicoDocenteGrupo, models.SET_NULL , null=True )
    periodo = models.ForeignKey(AcademicoPeriodo, models.SET_NULL , null=True )
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
    horario = models.ForeignKey('HorariosHorario', models.SET_NULL , null=True )
    aprobador = models.ForeignKey(AuthUsuario, models.SET_NULL , null=True )
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
    horario = models.ForeignKey('HorariosHorario', models.SET_NULL , null=True )
    dia_semana = models.CharField(max_length=15)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    asignatura = models.ForeignKey(AcademicoAsignatura, models.SET_NULL , blank=True, null=True)
    docente = models.ForeignKey('PersonasDocente', models.SET_NULL , blank=True, null=True)
    aula = models.CharField(max_length=50)
    notas = models.TextField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'horarios_detalle'


class HorariosHorario(models.Model):
    id = models.BigAutoField(primary_key=True)
    grupo = models.ForeignKey(AcademicoGrupo, models.SET_NULL , blank=True, null=True)
    docente = models.ForeignKey('PersonasDocente', models.SET_NULL , blank=True, null=True)
    nombre = models.CharField(max_length=200)
    tipo_horario = models.CharField(max_length=20, blank=True, null=True)
    version = models.IntegerField()
    horario_anterior = models.ForeignKey('self', on_delete=models.SET_NULL , blank=True, null=True,related_name='sucesores')
    estado = models.CharField(max_length=20)
    fecha_vigencia_inicio = models.DateField(blank=True, null=True)
    fecha_vigencia_fin = models.DateField(blank=True, null=True)
    notas = models.TextField(blank=True, null=True)
    creado_por = models.ForeignKey(AuthUsuario, models.SET_NULL , null=True )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'horarios_horario'

class HorariosIncapacidad(models.Model):
    id = models.BigAutoField(primary_key=True)
    docente = models.ForeignKey('PersonasDocente', models.SET_NULL , null=True )
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    motivo = models.TextField()
    numero_documento = models.CharField(max_length=50)
    documento_adjunto = models.CharField(max_length=255, blank=True, null=True)
    institucion_emisora = models.CharField(max_length=200)
    registrada_por = models.ForeignKey(AuthUsuario, models.SET_NULL , null=True )
    fecha_registro = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'horarios_incapacidad'


class HorariosPermiso(models.Model):
    id = models.BigAutoField(primary_key=True)
    docente = models.ForeignKey('PersonasDocente', models.SET_NULL , null=True )
    tipo_permiso = models.CharField(max_length=50)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    hora_inicio = models.TimeField(blank=True, null=True)
    hora_fin = models.TimeField(blank=True, null=True)
    motivo = models.TextField()
    estado = models.CharField(max_length=20)
    solicitado_por = models.ForeignKey(AuthUsuario, models.SET_NULL , null=True )
    aprobado_por = models.ForeignKey(AuthUsuario, models.SET_NULL , related_name='horariospermiso_aprobado_por_set', blank=True, null=True)
    fecha_solicitud = models.DateTimeField()
    fecha_aprobacion = models.DateTimeField(blank=True, null=True)
    comentarios_aprobacion = models.TextField()

    class Meta:
        managed = True
        db_table = 'horarios_permiso'


class PersonasDocente(models.Model):
    persona = models.OneToOneField('PersonasPersona', models.CASCADE , primary_key=True)
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
        return self.persona.nombre +" " +self.persona.primer_apellido 

class PersonasEncargado(models.Model):
    persona = models.OneToOneField('PersonasPersona', models.CASCADE , primary_key=True)
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
    persona = models.OneToOneField('PersonasPersona', models.CASCADE , primary_key=True)
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
    estudiante = models.ForeignKey(PersonasEstudiante, models.SET_NULL , null=True )
    encargado = models.ForeignKey(PersonasEncargado, models.SET_NULL , null=True )
    tipo_relacion = models.CharField(max_length=50)
    prioridad = models.IntegerField()
    fecha_asignacion = models.DateTimeField()
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
    email_institucional = models.CharField(max_length=255)
    direccion_exacta = models.TextField()
    provincia = models.CharField(max_length=50)
    canton = models.CharField(max_length=50)
    distrito = models.CharField(max_length=50)
    fotografia = models.CharField(max_length=255, blank=True, null=True)
    estado_civil = models.CharField(max_length=20)
    notas = models.TextField()
    activo = models.BooleanField(default=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField()
    creado_por = models.ForeignKey(AuthUsuario, models.SET_NULL , blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'personas_persona'


class PersonasPersonaRol(models.Model):
    id = models.BigAutoField(primary_key=True)
    persona = models.ForeignKey(PersonasPersona, models.SET_NULL , null=True )
    rol = models.ForeignKey(AuthRol, models.SET_NULL , null=True )
    fecha_asignacion = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'personas_persona_rol'
        unique_together = (('persona', 'rol'),)
