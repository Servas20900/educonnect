
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;

-- Tabla: Usuarios del Sistema
CREATE TABLE auth_usuario (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(128) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_staff BOOLEAN DEFAULT FALSE NOT NULL,
    is_superuser BOOLEAN DEFAULT FALSE NOT NULL,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    fecha_ultimo_login TIMESTAMP WITH TIME ZONE,
    ultima_actualizacion_password TIMESTAMP WITH TIME ZONE,
    intentos_fallidos INTEGER DEFAULT 0 NOT NULL,
    bloqueado BOOLEAN DEFAULT FALSE NOT NULL,
    fecha_bloqueo TIMESTAMP WITH TIME ZONE,
    motivo_bloqueo TEXT DEFAULT '' NOT NULL,
    debe_cambiar_password BOOLEAN DEFAULT FALSE NOT NULL,
    persona_id BIGINT UNIQUE
);

-- Tabla: Roles del Sistema
CREATE TABLE auth_rol (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT DEFAULT '' NOT NULL,
    tipo_rol VARCHAR(20) NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT tipo_rol_valido CHECK (tipo_rol IN ('sistema', 'institucional', 'academico', 'administrativo'))
);

-- Tabla: Permisos del Sistema
CREATE TABLE auth_permiso (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT DEFAULT '' NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(20) NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT accion_valida CHECK (accion IN ('crear', 'leer', 'actualizar', 'eliminar', 'ejecutar'))
);

-- Tabla: Relación Muchos a Muchos entre Usuarios y Roles
CREATE TABLE auth_usuario_rol (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES auth_usuario(id) ON DELETE CASCADE,
    rol_id BIGINT NOT NULL REFERENCES auth_rol(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    asignado_por_id BIGINT REFERENCES auth_usuario(id) ON DELETE SET NULL,
    CONSTRAINT usuario_rol_unico UNIQUE (usuario_id, rol_id)
);

-- Tabla: Relación Muchos a Muchos entre Roles y Permisos
CREATE TABLE auth_rol_permiso (
    id BIGSERIAL PRIMARY KEY,
    rol_id BIGINT NOT NULL REFERENCES auth_rol(id) ON DELETE CASCADE,
    permiso_id BIGINT NOT NULL REFERENCES auth_permiso(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT rol_permiso_unico UNIQUE (rol_id, permiso_id)
);

-- Tabla: Sesiones Activas
CREATE TABLE auth_sesion (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES auth_usuario(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT DEFAULT '' NOT NULL,
    fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    fecha_expiracion TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_ultimo_uso TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    activa BOOLEAN DEFAULT TRUE NOT NULL
);

-- Tabla: Auditoría de Operaciones Críticas
CREATE TABLE auth_auditoria_log (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT REFERENCES auth_usuario(id) ON DELETE SET NULL,
    accion VARCHAR(100) NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    descripcion TEXT DEFAULT '' NOT NULL,
    tabla_afectada VARCHAR(100) NOT NULL,
    registro_id VARCHAR(100) NOT NULL,
    resultado VARCHAR(20) NOT NULL,
    mensaje_error TEXT DEFAULT '' NOT NULL,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address INET,
    user_agent TEXT DEFAULT '' NOT NULL,
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT resultado_valido CHECK (resultado IN ('exitoso', 'fallido', 'parcial'))
);

CREATE INDEX idx_usuario_username ON auth_usuario(username);
CREATE INDEX idx_usuario_email ON auth_usuario(email);
CREATE INDEX idx_usuario_activo ON auth_usuario(is_active);
CREATE INDEX idx_sesion_token ON auth_sesion(token);
CREATE INDEX idx_sesion_activa ON auth_sesion(activa);
CREATE INDEX idx_auditoria_fecha ON auth_auditoria_log(fecha_hora);
CREATE INDEX idx_auditoria_usuario ON auth_auditoria_log(usuario_id);

-- Tabla: Personas
CREATE TABLE personas_persona (
    id BIGSERIAL PRIMARY KEY,
    identificacion VARCHAR(20) UNIQUE NOT NULL,
    tipo_identificacion VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    primer_apellido VARCHAR(100) NOT NULL,
    segundo_apellido VARCHAR(100) DEFAULT '' NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    genero VARCHAR(20) NOT NULL,
    nacionalidad VARCHAR(50) DEFAULT 'Costarricense' NOT NULL,
    telefono_principal VARCHAR(20) DEFAULT '' NOT NULL,
    telefono_secundario VARCHAR(20) DEFAULT '' NOT NULL,
    email_personal VARCHAR(255) DEFAULT '' NOT NULL,
    email_institucional VARCHAR(255) DEFAULT '' NOT NULL,
    direccion_exacta TEXT DEFAULT '' NOT NULL,
    provincia VARCHAR(50) DEFAULT '' NOT NULL,
    canton VARCHAR(50) DEFAULT '' NOT NULL,
    distrito VARCHAR(50) DEFAULT '' NOT NULL,
    fotografia VARCHAR(255),
    estado_civil VARCHAR(20) DEFAULT '' NOT NULL,
    notas TEXT DEFAULT '' NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    creado_por_id BIGINT REFERENCES auth_usuario(id) ON DELETE SET NULL,
    CONSTRAINT tipo_identificacion_valido CHECK (tipo_identificacion IN ('cedula', 'pasaporte', 'dimex', 'otro')),
    CONSTRAINT genero_valido CHECK (genero IN ('masculino', 'femenino', 'otro', 'prefiero_no_decir'))
);

-- Tabla: Docentes
CREATE TABLE personas_docente (
    persona_id BIGINT PRIMARY KEY REFERENCES personas_persona(id) ON DELETE CASCADE,
    codigo_empleado VARCHAR(50) UNIQUE NOT NULL,
    especialidad VARCHAR(100) NOT NULL,
    nivel_academico VARCHAR(50) NOT NULL,
    fecha_ingreso DATE NOT NULL,
    fecha_salida DATE,
    estado_laboral VARCHAR(20) DEFAULT 'activo' NOT NULL,
    tipo_contrato VARCHAR(20) NOT NULL,
    horas_contratadas INTEGER NOT NULL,
    salario_base DECIMAL(10, 2),
    numero_cuenta_bancaria VARCHAR(50) DEFAULT '' NOT NULL,
    titulo_profesional VARCHAR(200) DEFAULT '' NOT NULL,
    universidad VARCHAR(200) DEFAULT '' NOT NULL,
    año_graduacion INTEGER,
    CONSTRAINT estado_laboral_valido CHECK (estado_laboral IN ('activo', 'inactivo', 'licencia', 'suspendido', 'retirado')),
    CONSTRAINT tipo_contrato_valido CHECK (tipo_contrato IN ('indefinido', 'definido', 'interino', 'por_horas'))
);

-- Tabla: Estudiantes
CREATE TABLE personas_estudiante (
    persona_id BIGINT PRIMARY KEY REFERENCES personas_persona(id) ON DELETE CASCADE,
    codigo_estudiante VARCHAR(50) UNIQUE NOT NULL,
    fecha_ingreso DATE NOT NULL,
    fecha_retiro DATE,
    estado_estudiante VARCHAR(20) DEFAULT 'activo' NOT NULL,
    tipo_estudiante VARCHAR(20) DEFAULT 'regular' NOT NULL,
    condicion_especial VARCHAR(50) DEFAULT '' NOT NULL,
    beca BOOLEAN DEFAULT FALSE NOT NULL,
    tipo_beca VARCHAR(50) DEFAULT '' NOT NULL,
    porcentaje_beca DECIMAL(5, 2) DEFAULT 0.00 NOT NULL,
    tiene_adecuacion BOOLEAN DEFAULT FALSE NOT NULL,
    tipo_adecuacion VARCHAR(50) DEFAULT '' NOT NULL,
    CONSTRAINT estado_estudiante_valido CHECK (estado_estudiante IN ('activo', 'inactivo', 'retirado', 'trasladado', 'graduado')),
    CONSTRAINT tipo_estudiante_valido CHECK (tipo_estudiante IN ('regular', 'repitente', 'nuevo_ingreso', 'traslado'))
);

-- Tabla: Encargados (Responsables de Estudiantes)
CREATE TABLE personas_encargado (
    persona_id BIGINT PRIMARY KEY REFERENCES personas_persona(id) ON DELETE CASCADE,
    parentesco VARCHAR(50) NOT NULL,
    ocupacion VARCHAR(100) DEFAULT '' NOT NULL,
    lugar_trabajo VARCHAR(200) DEFAULT '' NOT NULL,
    telefono_trabajo VARCHAR(20) DEFAULT '' NOT NULL,
    es_responsable_economico BOOLEAN DEFAULT TRUE NOT NULL,
    es_contacto_emergencia BOOLEAN DEFAULT TRUE NOT NULL,
    nivel_educativo VARCHAR(50) DEFAULT '' NOT NULL
);

-- Tabla: Relación entre Estudiantes y Encargados
CREATE TABLE personas_estudiante_encargado (
    id BIGSERIAL PRIMARY KEY,
    estudiante_id BIGINT NOT NULL REFERENCES personas_estudiante(persona_id) ON DELETE CASCADE,
    encargado_id BIGINT NOT NULL REFERENCES personas_encargado(persona_id) ON DELETE CASCADE,
    tipo_relacion VARCHAR(50) NOT NULL,
    prioridad INTEGER DEFAULT 1 NOT NULL,
    fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT estudiante_encargado_unico UNIQUE (estudiante_id, encargado_id)
);

-- Tabla: Relación entre Personas y Roles
CREATE TABLE personas_persona_rol (
    id BIGSERIAL PRIMARY KEY,
    persona_id BIGINT NOT NULL REFERENCES personas_persona(id) ON DELETE CASCADE,
    rol_id BIGINT NOT NULL REFERENCES auth_rol(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT persona_rol_unico UNIQUE (persona_id, rol_id)
);

CREATE INDEX idx_persona_identificacion ON personas_persona(identificacion);
CREATE INDEX idx_persona_activo ON personas_persona(activo);
CREATE INDEX idx_docente_codigo ON personas_docente(codigo_empleado);
CREATE INDEX idx_docente_estado ON personas_docente(estado_laboral);
CREATE INDEX idx_estudiante_codigo ON personas_estudiante(codigo_estudiante);
CREATE INDEX idx_estudiante_estado ON personas_estudiante(estado_estudiante);

-- Tabla: Periodos Académicos
CREATE TABLE academico_periodo (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    año_lectivo INTEGER NOT NULL,
    tipo_periodo VARCHAR(20) NOT NULL,
    numero_periodo INTEGER NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(20) DEFAULT 'planificado' NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT tipo_periodo_valido CHECK (tipo_periodo IN ('anual', 'semestral', 'trimestral', 'bimestral')),
    CONSTRAINT estado_periodo_valido CHECK (estado IN ('planificado', 'activo', 'finalizado', 'cancelado')),
    CONSTRAINT periodo_unico UNIQUE (año_lectivo, tipo_periodo, numero_periodo)
);

-- Tabla: Grados
CREATE TABLE academico_grado (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    nivel VARCHAR(20) NOT NULL,
    numero_grado INTEGER NOT NULL,
    descripcion TEXT DEFAULT '' NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT nivel_valido CHECK (nivel IN ('preescolar', 'primaria', 'secundaria', 'diversificada')),
    CONSTRAINT grado_unico UNIQUE (nivel, numero_grado)
);

-- Tabla: Secciones
CREATE TABLE academico_seccion (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    descripcion TEXT DEFAULT '' NOT NULL,
    capacidad_maxima INTEGER DEFAULT 30 NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL
);

-- Tabla: Grupos
CREATE TABLE academico_grupo (
    id BIGSERIAL PRIMARY KEY,
    periodo_id BIGINT NOT NULL REFERENCES academico_periodo(id) ON DELETE CASCADE,
    grado_id BIGINT NOT NULL REFERENCES academico_grado(id) ON DELETE RESTRICT,
    seccion_id BIGINT NOT NULL REFERENCES academico_seccion(id) ON DELETE RESTRICT,
    docente_guia_id BIGINT REFERENCES personas_docente(persona_id) ON DELETE SET NULL,
    nombre VARCHAR(200) NOT NULL,
    codigo_grupo VARCHAR(50) UNIQUE NOT NULL,
    aula VARCHAR(50) DEFAULT '' NOT NULL,
    estado VARCHAR(20) DEFAULT 'activo' NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT estado_grupo_valido CHECK (estado IN ('activo', 'inactivo', 'cerrado')),
    CONSTRAINT grupo_unico UNIQUE (periodo_id, grado_id, seccion_id)
);

-- Tabla: Asignaturas
CREATE TABLE academico_asignatura (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    area VARCHAR(50) NOT NULL,
    descripcion TEXT DEFAULT '' NOT NULL,
    horas_semanales INTEGER DEFAULT 0 NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabla: Relación entre Asignaturas y Grados
CREATE TABLE academico_asignatura_grado (
    id BIGSERIAL PRIMARY KEY,
    asignatura_id BIGINT NOT NULL REFERENCES academico_asignatura(id) ON DELETE CASCADE,
    grado_id BIGINT NOT NULL REFERENCES academico_grado(id) ON DELETE CASCADE,
    horas_semanales INTEGER DEFAULT 0 NOT NULL,
    obligatoria BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT asignatura_grado_unico UNIQUE (asignatura_id, grado_id)
);

-- Tabla: Asignación de Docentes a Grupos por Asignatura
CREATE TABLE academico_docente_grupo (
    id BIGSERIAL PRIMARY KEY,
    docente_id BIGINT NOT NULL REFERENCES personas_docente(persona_id) ON DELETE CASCADE,
    grupo_id BIGINT NOT NULL REFERENCES academico_grupo(id) ON DELETE CASCADE,
    asignatura_id BIGINT NOT NULL REFERENCES academico_asignatura(id) ON DELETE RESTRICT,
    horas_semanales INTEGER DEFAULT 0 NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT docente_grupo_asignatura_unico UNIQUE (docente_id, grupo_id, asignatura_id)
);

-- Tabla: Matrícula de Estudiantes en Grupos
CREATE TABLE academico_matricula (
    id BIGSERIAL PRIMARY KEY,
    estudiante_id BIGINT NOT NULL REFERENCES personas_estudiante(persona_id) ON DELETE CASCADE,
    grupo_id BIGINT NOT NULL REFERENCES academico_grupo(id) ON DELETE CASCADE,
    fecha_matricula DATE NOT NULL,
    fecha_retiro DATE,
    estado VARCHAR(20) DEFAULT 'activo' NOT NULL,
    observaciones TEXT DEFAULT '' NOT NULL,
    CONSTRAINT estado_matricula_valido CHECK (estado IN ('activo', 'retirado', 'trasladado', 'finalizado')),
    CONSTRAINT matricula_unica UNIQUE (estudiante_id, grupo_id)
);

CREATE INDEX idx_periodo_año ON academico_periodo(año_lectivo);
CREATE INDEX idx_periodo_estado ON academico_periodo(estado);
CREATE INDEX idx_grupo_periodo ON academico_grupo(periodo_id);
CREATE INDEX idx_grupo_estado ON academico_grupo(estado);
CREATE INDEX idx_matricula_estudiante ON academico_matricula(estudiante_id);
CREATE INDEX idx_matricula_grupo ON academico_matricula(grupo_id);
CREATE INDEX idx_docente_grupo_docente ON academico_docente_grupo(docente_id);

-- Tabla: Horarios
CREATE TABLE horarios_horario (
    id BIGSERIAL PRIMARY KEY,
    grupo_id BIGINT REFERENCES academico_grupo(id) ON DELETE CASCADE,
    docente_id BIGINT REFERENCES personas_docente(persona_id) ON DELETE CASCADE,
    periodo_id BIGINT NOT NULL REFERENCES academico_periodo(id) ON DELETE CASCADE,
    nombre VARCHAR(200) NOT NULL,
    tipo_horario VARCHAR(20) NOT NULL,
    version INTEGER DEFAULT 1 NOT NULL,
    horario_anterior_id BIGINT REFERENCES horarios_horario(id) ON DELETE SET NULL,
    estado VARCHAR(20) DEFAULT 'borrador' NOT NULL,
    fecha_vigencia_inicio DATE NOT NULL,
    fecha_vigencia_fin DATE,
    notas TEXT DEFAULT '' NOT NULL,
    creado_por_id BIGINT NOT NULL REFERENCES auth_usuario(id) ON DELETE RESTRICT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT tipo_horario_valido CHECK (tipo_horario IN ('grupo', 'docente', 'aula', 'especial')),
    CONSTRAINT estado_horario_valido CHECK (estado IN ('borrador', 'revision', 'aprobado', 'activo', 'archivado'))
);

-- Tabla: Detalle de Horarios
CREATE TABLE horarios_detalle (
    id BIGSERIAL PRIMARY KEY,
    horario_id BIGINT NOT NULL REFERENCES horarios_horario(id) ON DELETE CASCADE,
    dia_semana VARCHAR(15) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    asignatura_id BIGINT REFERENCES academico_asignatura(id) ON DELETE RESTRICT,
    docente_id BIGINT REFERENCES personas_docente(persona_id) ON DELETE SET NULL,
    aula VARCHAR(50) DEFAULT '' NOT NULL,
    notas TEXT DEFAULT '' NOT NULL,
    CONSTRAINT dia_semana_valido CHECK (dia_semana IN ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'))
);

-- Tabla: Aprobaciones de Horarios
CREATE TABLE horarios_aprobacion (
    id BIGSERIAL PRIMARY KEY,
    horario_id BIGINT NOT NULL REFERENCES horarios_horario(id) ON DELETE CASCADE,
    aprobador_id BIGINT NOT NULL REFERENCES auth_usuario(id) ON DELETE RESTRICT,
    nivel_aprobacion INTEGER NOT NULL,
    estado_aprobacion VARCHAR(20) NOT NULL,
    fecha_revision TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    fecha_decision TIMESTAMP WITH TIME ZONE,
    comentarios TEXT DEFAULT '' NOT NULL,
    CONSTRAINT estado_aprobacion_valido CHECK (estado_aprobacion IN ('pendiente', 'aprobado', 'rechazado', 'revision')),
    CONSTRAINT horario_nivel_unico UNIQUE (horario_id, nivel_aprobacion)
);

-- Tabla: Incapacidades Médicas
CREATE TABLE horarios_incapacidad (
    id BIGSERIAL PRIMARY KEY,
    docente_id BIGINT NOT NULL REFERENCES personas_docente(persona_id) ON DELETE CASCADE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    motivo TEXT NOT NULL,
    numero_documento VARCHAR(50) DEFAULT '' NOT NULL,
    documento_adjunto VARCHAR(255),
    institucion_emisora VARCHAR(200) DEFAULT '' NOT NULL,
    registrada_por_id BIGINT NOT NULL REFERENCES auth_usuario(id) ON DELETE RESTRICT,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabla: Permisos
CREATE TABLE horarios_permiso (
    id BIGSERIAL PRIMARY KEY,
    docente_id BIGINT NOT NULL REFERENCES personas_docente(persona_id) ON DELETE CASCADE,
    tipo_permiso VARCHAR(50) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    hora_inicio TIME,
    hora_fin TIME,
    motivo TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' NOT NULL,
    solicitado_por_id BIGINT NOT NULL REFERENCES auth_usuario(id) ON DELETE RESTRICT,
    aprobado_por_id BIGINT REFERENCES auth_usuario(id) ON DELETE SET NULL,
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    comentarios_aprobacion TEXT DEFAULT '' NOT NULL,
    CONSTRAINT estado_permiso_valido CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'cancelado'))
);

CREATE INDEX idx_horario_grupo ON horarios_horario(grupo_id);
CREATE INDEX idx_horario_docente ON horarios_horario(docente_id);
CREATE INDEX idx_horario_estado ON horarios_horario(estado);
CREATE INDEX idx_detalle_horario ON horarios_detalle(horario_id);
CREATE INDEX idx_incapacidad_docente ON horarios_incapacidad(docente_id);
CREATE INDEX idx_permiso_docente ON horarios_permiso(docente_id);

-- Tabla: Evaluaciones
CREATE TABLE evaluaciones_evaluacion (
    id BIGSERIAL PRIMARY KEY,
    docente_grupo_id BIGINT NOT NULL REFERENCES academico_docente_grupo(id) ON DELETE CASCADE,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT DEFAULT '' NOT NULL,
    tipo_evaluacion VARCHAR(50) NOT NULL,
    fecha_evaluacion DATE NOT NULL,
    fecha_entrega DATE,
    valor_porcentual DECIMAL(5, 2) NOT NULL,
    nota_maxima DECIMAL(5, 2) DEFAULT 100.00 NOT NULL,
    rubrica JSONB,
    instrucciones TEXT DEFAULT '' NOT NULL,
    visible_estudiantes BOOLEAN DEFAULT TRUE NOT NULL,
    permite_recuperacion BOOLEAN DEFAULT FALSE NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT tipo_evaluacion_valido CHECK (tipo_evaluacion IN ('formativa', 'sumativa', 'diagnostica', 'trabajo', 'examen', 'proyecto', 'tarea', 'participacion'))
);

-- Tabla: Calificaciones
CREATE TABLE evaluaciones_calificacion (
    id BIGSERIAL PRIMARY KEY,
    evaluacion_id BIGINT NOT NULL REFERENCES evaluaciones_evaluacion(id) ON DELETE CASCADE,
    estudiante_id BIGINT NOT NULL REFERENCES personas_estudiante(persona_id) ON DELETE CASCADE,
    nota DECIMAL(5, 2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'definitiva' NOT NULL,
    ausente BOOLEAN DEFAULT FALSE NOT NULL,
    justificado BOOLEAN DEFAULT FALSE NOT NULL,
    observaciones TEXT DEFAULT '' NOT NULL,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    registrada_por_id BIGINT NOT NULL REFERENCES auth_usuario(id) ON DELETE RESTRICT,
    CONSTRAINT estado_calificacion_valido CHECK (estado IN ('temporal', 'definitiva', 'modificada', 'anulada')),
    CONSTRAINT calificacion_unica UNIQUE (evaluacion_id, estudiante_id)
);

-- Tabla: Historial de Calificaciones
CREATE TABLE evaluaciones_historial_calificacion (
    id BIGSERIAL PRIMARY KEY,
    calificacion_id BIGINT NOT NULL REFERENCES evaluaciones_calificacion(id) ON DELETE CASCADE,
    nota_anterior DECIMAL(5, 2),
    nota_nueva DECIMAL(5, 2) NOT NULL,
    motivo_cambio TEXT NOT NULL,
    modificada_por_id BIGINT NOT NULL REFERENCES auth_usuario(id) ON DELETE RESTRICT,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabla: Promedios por Asignatura
CREATE TABLE evaluaciones_promedio (
    id BIGSERIAL PRIMARY KEY,
    estudiante_id BIGINT NOT NULL REFERENCES personas_estudiante(persona_id) ON DELETE CASCADE,
    docente_grupo_id BIGINT NOT NULL REFERENCES academico_docente_grupo(id) ON DELETE CASCADE,
    periodo_id BIGINT NOT NULL REFERENCES academico_periodo(id) ON DELETE CASCADE,
    promedio DECIMAL(5, 2) NOT NULL,
    total_ausencias INTEGER DEFAULT 0 NOT NULL,
    total_tardias INTEGER DEFAULT 0 NOT NULL,
    notas_adicionales TEXT DEFAULT '' NOT NULL,
    fecha_calculo TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT promedio_unico UNIQUE (estudiante_id, docente_grupo_id, periodo_id)
);

-- Tabla: Asistencia
CREATE TABLE evaluaciones_asistencia (
    id BIGSERIAL PRIMARY KEY,
    estudiante_id BIGINT NOT NULL REFERENCES personas_estudiante(persona_id) ON DELETE CASCADE,
    grupo_id BIGINT NOT NULL REFERENCES academico_grupo(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado VARCHAR(20) NOT NULL,
    justificada BOOLEAN DEFAULT FALSE NOT NULL,
    motivo TEXT DEFAULT '' NOT NULL,
    documento_adjunto VARCHAR(255),
    registrada_por_id BIGINT NOT NULL REFERENCES auth_usuario(id) ON DELETE RESTRICT,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT estado_asistencia_valido CHECK (estado IN ('presente', 'ausente', 'tardia', 'permiso')),
    CONSTRAINT asistencia_unica UNIQUE (estudiante_id, grupo_id, fecha, hora)
);

CREATE INDEX idx_evaluacion_docente_grupo ON evaluaciones_evaluacion(docente_grupo_id);
CREATE INDEX idx_calificacion_evaluacion ON evaluaciones_calificacion(evaluacion_id);
CREATE INDEX idx_calificacion_estudiante ON evaluaciones_calificacion(estudiante_id);
CREATE INDEX idx_asistencia_estudiante ON evaluaciones_asistencia(estudiante_id);
CREATE INDEX idx_asistencia_fecha ON evaluaciones_asistencia(fecha);

-- Tabla: Repositorios
CREATE TABLE documentos_repositorio (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT DEFAULT '' NOT NULL,
    padre_id BIGINT REFERENCES documentos_repositorio(id) ON DELETE CASCADE,
    tipo_contenido VARCHAR(50) NOT NULL,
    permisos_lectura JSONB DEFAULT '[]'::jsonb NOT NULL,
    permisos_escritura JSONB DEFAULT '[]'::jsonb NOT NULL,
    es_publico BOOLEAN DEFAULT FALSE NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    creado_por_id BIGINT NOT NULL REFERENCES auth_usuario(id) ON DELETE RESTRICT,
    CONSTRAINT tipo_contenido_valido CHECK (tipo_contenido IN ('carpeta', 'academico', 'administrativo', 'personal', 'compartido'))
);

-- Tabla: Documentos
CREATE TABLE documentos_documento (
    id BIGSERIAL PRIMARY KEY,
    repositorio_id BIGINT NOT NULL REFERENCES documentos_repositorio(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT DEFAULT '' NOT NULL,
    tipo_documento VARCHAR(50) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    tamaño_bytes BIGINT NOT NULL,
    extension VARCHAR(10) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    version INTEGER DEFAULT 1 NOT NULL,
    documento_anterior_id BIGINT REFERENCES documentos_documento(id) ON DELETE SET NULL,
    hash_md5 VARCHAR(32) NOT NULL,
    es_version_actual BOOLEAN DEFAULT TRUE NOT NULL,
    etiquetas JSONB DEFAULT '[]'::jsonb NOT NULL,
    metadatos JSONB DEFAULT '{}'::jsonb NOT NULL,
    fecha_documento DATE,
    fecha_carga TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    cargado_por_id BIGINT NOT NULL REFERENCES auth_usuario(id) ON DELETE RESTRICT
);

-- Tabla: Plantillas de Documentos
CREATE TABLE documentos_plantilla (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT DEFAULT '' NOT NULL,
    tipo_documento VARCHAR(50) NOT NULL,
    contenido_plantilla TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    activa BOOLEAN DEFAULT TRUE NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    creada_por_id BIGINT NOT NULL REFERENCES auth_usuario(id) ON DELETE RESTRICT
);

-- Tabla: Documentos Compartidos
CREATE TABLE documentos_compartido (
    id BIGSERIAL PRIMARY KEY,
    documento_id BIGINT NOT NULL REFERENCES documentos_documento(id) ON DELETE CASCADE,
    compartido_con_tipo VARCHAR(20) NOT NULL,
    compartido_con_id BIGINT NOT NULL,
    permisos VARCHAR(20) NOT NULL,
    fecha_compartido TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    compartido_por_id BIGINT NOT NULL REFERENCES auth_usuario(id) ON DELETE RESTRICT,
    fecha_expiracion TIMESTAMP WITH TIME ZONE,
    CONSTRAINT compartido_tipo_valido CHECK (compartido_con_tipo IN ('usuario', 'rol', 'grupo')),
    CONSTRAINT permisos_valido CHECK (permisos IN ('lectura', 'escritura', 'admin'))
);

CREATE INDEX idx_repositorio_padre ON documentos_repositorio(padre_id);
CREATE INDEX idx_documento_repositorio ON documentos_documento(repositorio_id);
CREATE INDEX idx_documento_version ON documentos_documento(version);

-- Tabla: Circulares
CREATE TABLE comunicaciones_circular (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vigencia_inicio DATE NOT NULL,
    fecha_vigencia_fin DATE,
    prioridad VARCHAR(20) DEFAULT 'normal' NOT NULL,
    requiere_confirmacion BOOLEAN DEFAULT FALSE NOT NULL,
    archivo_adjunto VARCHAR(255),
    roles_destinatarios JSONB DEFAULT '[]'::jsonb NOT NULL,
    activa BOOLEAN DEFAULT TRUE NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    creada_por_id BIGINT NOT NULL REFERENCES auth_usuario(id) ON DELETE RESTRICT,
    CONSTRAINT prioridad_valida CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente'))
);

-- Tabla: Lectura de Circulares
CREATE TABLE comunicaciones_lectura_circular (
    id BIGSERIAL PRIMARY KEY,
    circular_id BIGINT NOT NULL REFERENCES comunicaciones_circular(id) ON DELETE CASCADE,
    persona_id BIGINT NOT NULL REFERENCES personas_persona(id) ON DELETE CASCADE,
    fecha_lectura TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    confirmada BOOLEAN DEFAULT FALSE NOT NULL,
    fecha_confirmacion TIMESTAMP WITH TIME ZONE,
    CONSTRAINT lectura_unica UNIQUE (circular_id, persona_id)
);

-- Tabla: Notificaciones del Sistema
CREATE TABLE comunicaciones_notificacion (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES auth_usuario(id) ON DELETE CASCADE,
    tipo_notificacion VARCHAR(50) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    enlace VARCHAR(500) DEFAULT '' NOT NULL,
    leida BOOLEAN DEFAULT FALSE NOT NULL,
    fecha_lectura TIMESTAMP WITH TIME ZONE,
    prioridad VARCHAR(20) DEFAULT 'normal' NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    fecha_expiracion TIMESTAMP WITH TIME ZONE,
    CONSTRAINT prioridad_notificacion_valida CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente'))
);

-- Tabla: Comunicados Generales
CREATE TABLE comunicaciones_comunicado (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,
    tipo_comunicado VARCHAR(50) NOT NULL,
    destinatarios JSONB DEFAULT '[]'::jsonb NOT NULL,
    fecha_publicacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    fecha_vigencia TIMESTAMP WITH TIME ZONE,
    visible BOOLEAN DEFAULT TRUE NOT NULL,
    publicado_por_id BIGINT NOT NULL REFERENCES auth_usuario(id) ON DELETE RESTRICT,
    CONSTRAINT tipo_comunicado_valido CHECK (tipo_comunicado IN ('informativo', 'urgente', 'evento', 'aviso', 'felicitacion'))
);

CREATE INDEX idx_circular_activa ON comunicaciones_circular(activa);
CREATE INDEX idx_circular_fecha ON comunicaciones_circular(fecha_emision);
CREATE INDEX idx_notificacion_usuario ON comunicaciones_notificacion(usuario_id);
CREATE INDEX idx_notificacion_leida ON comunicaciones_notificacion(leida);

-- Tabla: Comités
CREATE TABLE comites_comite (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    tipo_comite VARCHAR(50) NOT NULL,
    descripcion TEXT DEFAULT '' NOT NULL,
    objetivos TEXT DEFAULT '' NOT NULL,
    periodo_id BIGINT REFERENCES academico_periodo(id) ON DELETE SET NULL,
    fecha_creacion DATE NOT NULL,
    fecha_disolucion DATE,
    estado VARCHAR(20) DEFAULT 'activo' NOT NULL,
    reglamento TEXT DEFAULT '' NOT NULL,
    CONSTRAINT tipo_comite_valido CHECK (tipo_comite IN ('institucional', 'disciplinario', 'evaluacion', 'apoyo', 'especial')),
    CONSTRAINT estado_comite_valido CHECK (estado IN ('activo', 'inactivo', 'disuelto'))
);

-- Tabla: Miembros de Comités
CREATE TABLE comites_miembro (
    id BIGSERIAL PRIMARY KEY,
    comite_id BIGINT NOT NULL REFERENCES comites_comite(id) ON DELETE CASCADE,
    persona_id BIGINT NOT NULL REFERENCES personas_persona(id) ON DELETE CASCADE,
    cargo VARCHAR(100) NOT NULL,
    fecha_nombramiento DATE NOT NULL,
    fecha_cese DATE,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT miembro_comite_unico UNIQUE (comite_id, persona_id, cargo)
);

-- Tabla: Reuniones de Comités
CREATE TABLE comites_reunion (
    id BIGSERIAL PRIMARY KEY,
    comite_id BIGINT NOT NULL REFERENCES comites_comite(id) ON DELETE CASCADE,
    numero_reunion INTEGER NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME,
    lugar VARCHAR(200) NOT NULL,
    modalidad VARCHAR(20) NOT NULL,
    tema TEXT NOT NULL,
    convocada_por_id BIGINT NOT NULL REFERENCES auth_usuario(id) ON DELETE RESTRICT,
    asistentes JSONB DEFAULT '[]'::jsonb NOT NULL,
    estado VARCHAR(20) DEFAULT 'programada' NOT NULL,
    fecha_convocatoria TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT modalidad_valida CHECK (modalidad IN ('presencial', 'virtual', 'hibrida')),
    CONSTRAINT estado_reunion_valido CHECK (estado IN ('programada', 'en_curso', 'finalizada', 'cancelada')),
    CONSTRAINT reunion_unica UNIQUE (comite_id, numero_reunion)
);

-- Tabla: Actas de Reuniones
CREATE TABLE comites_acta (
    id BIGSERIAL PRIMARY KEY,
    reunion_id BIGINT UNIQUE NOT NULL REFERENCES comites_reunion(id) ON DELETE CASCADE,
    numero_acta VARCHAR(50) NOT NULL,
    contenido TEXT NOT NULL,
    acuerdos TEXT DEFAULT '' NOT NULL,
    seguimientos TEXT DEFAULT '' NOT NULL,
    estado VARCHAR(20) DEFAULT 'borrador' NOT NULL,
    elaborada_por_id BIGINT NOT NULL REFERENCES auth_usuario(id) ON DELETE RESTRICT,
    aprobada_por_id BIGINT REFERENCES auth_usuario(id) ON DELETE SET NULL,
    fecha_elaboracion TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    CONSTRAINT estado_acta_valido CHECK (estado IN ('borrador', 'revision', 'aprobada', 'archivada'))
);

-- Tabla: Órganos Auxiliares
CREATE TABLE comites_organo_auxiliar (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    tipo_organo VARCHAR(50) NOT NULL,
    descripcion TEXT DEFAULT '' NOT NULL,
    periodo_id BIGINT REFERENCES academico_periodo(id) ON DELETE SET NULL,
    coordinador_id BIGINT REFERENCES personas_persona(id) ON DELETE SET NULL,
    fecha_creacion DATE NOT NULL,
    estado VARCHAR(20) DEFAULT 'activo' NOT NULL,
    CONSTRAINT tipo_organo_valido CHECK (tipo_organo IN ('PAT', 'consejo', 'junta', 'equipo', 'otro')),
    CONSTRAINT estado_organo_valido CHECK (estado IN ('activo', 'inactivo'))
);

-- Tabla: Informes de Órganos Auxiliares
CREATE TABLE comites_informe_organo (
    id BIGSERIAL PRIMARY KEY,
    organo_id BIGINT NOT NULL REFERENCES comites_organo_auxiliar(id) ON DELETE CASCADE,
    periodo_id BIGINT NOT NULL REFERENCES academico_periodo(id) ON DELETE CASCADE,
    tipo_informe VARCHAR(50) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,
    conclusiones TEXT DEFAULT '' NOT NULL,
    recomendaciones TEXT DEFAULT '' NOT NULL,
    archivo_adjunto VARCHAR(255),
    elaborado_por_id BIGINT NOT NULL REFERENCES auth_usuario(id) ON DELETE RESTRICT,
    fecha_elaboracion DATE NOT NULL,
    fecha_presentacion DATE,
    estado VARCHAR(20) DEFAULT 'borrador' NOT NULL,
    CONSTRAINT tipo_informe_valido CHECK (tipo_informe IN ('mensual', 'trimestral', 'semestral', 'anual', 'especial')),
    CONSTRAINT estado_informe_valido CHECK (estado IN ('borrador', 'finalizado', 'presentado', 'aprobado'))
);

CREATE INDEX idx_comite_estado ON comites_comite(estado);
CREATE INDEX idx_miembro_comite ON comites_miembro(comite_id);
CREATE INDEX idx_reunion_comite ON comites_reunion(comite_id);
CREATE INDEX idx_reunion_fecha ON comites_reunion(fecha);

ALTER TABLE auth_usuario ADD CONSTRAINT fk_usuario_persona 
    FOREIGN KEY (persona_id) REFERENCES personas_persona(id) ON DELETE SET NULL;



