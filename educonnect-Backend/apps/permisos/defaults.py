DEFAULT_NAVIGATION = {
    "items": [
        {
            "id": "admin",
            "title": "Administracion",
            "type": "group",
            "allowed_roles": ["administrador"],
            "children": [
                {
                    "id": "admin-items",
                    "type": "collapse",
                    "children": [
                        {"id": "dashboard", "title": "Dashboard", "type": "item", "url": "/dashboard"},
                        {"id": "circulares", "title": "Circulares", "type": "item", "url": "/circulares"},
                        {"id": "horarios", "title": "Horarios", "type": "item", "url": "/horarios"},
                        {"id": "documentos", "title": "Documentos", "type": "item", "url": "/documentos"},
                        {"id": "incapacidades", "title": "Incapacidades", "type": "item", "url": "/incapacidades"},
                        {"id": "usuarios", "title": "Usuarios", "type": "item", "url": "/usuarios"},
                        {"id": "reportes", "title": "Reportes", "type": "item", "url": "/reportes"},
                        {"id": "comites", "title": "Comites", "type": "item", "url": "/comites"},
                        {"id": "backups", "title": "Backups", "type": "item", "url": "/backups"}
                    ]
                }
            ]
        },
        {
            "id": "docente",
            "title": "Docente",
            "type": "group",
            "allowed_roles": ["administrador", "docente"],
            "children": [
                {
                    "id": "docente-items",
                    "type": "collapse",
                    "children": [
                        {"id": "docente-estudiantes", "title": "Estudiantes", "type": "item", "url": "/docente/estudiantes"},
                        {"id": "academico", "title": "Academico", "type": "item", "url": "/docente/academico"},
                        {"id": "asistencia", "title": "Asistencia", "type": "item", "url": "/docente/asistencia"},
                        {"id": "riesgo", "title": "Riesgo academico", "type": "item", "url": "/docente/riesgo"},
                        {"id": "planeamientos", "title": "Planeamientos", "type": "item", "url": "/docente/planeamientos"},
                        {"id": "comunicados", "title": "Comunicados", "type": "item", "url": "/docente/comunicados"},
                        {"id": "circulares", "title": "Circulares", "type": "item", "url": "/docente/circulares"},
                        {"id": "documentos", "title": "Documentos", "type": "item", "url": "/documentos"},
                        {"id": "docente-horario", "title": "Horario", "type": "item", "url": "/docente/horario"},
                        {"id": "docente-incapacidades", "title": "Incapacidades", "type": "item", "url": "/docente/incapacidades"},
                        {"id": "exportaciones", "title": "Exportaciones", "type": "item", "url": "/docente/exportaciones"}
                    ]
                }
            ]
        },
        {
            "id": "comite-group",
            "title": "Comite",
            "type": "group",
            "allowed_roles": ["administrador", "docente", "comite"],
            "children": [
                {
                    "id": "comite-items",
                    "type": "collapse",
                    "children": [
                        {"id": "crear-acta", "title": "Actas", "type": "item", "url": "/comite/actas"},
                        {"id": "agendar-reunion", "title": "Reuniones", "type": "item", "url": "/comite/reuniones"},
                        {"id": "roles-comite", "title": "Roles", "type": "item", "url": "/comite/roles"}
                    ]
                }
            ]
        },
        {
            "id": "auxiliares",
            "title": "Auxiliares",
            "type": "group",
            "allowed_roles": ["administrador"],
            "children": [
                {
                    "id": "auxiliares-items",
                    "type": "collapse",
                    "children": [
                        {"id": "informes-economicos", "title": "Informes", "type": "item", "url": "/auxiliares/informes"},
                        {"id": "reglamentos", "title": "Reglamentos", "type": "item", "url": "/auxiliares/reglamentos"},
                        {"id": "reportes-cumplimiento", "title": "Cumplimiento", "type": "item", "url": "/auxiliares/cumplimiento"}
                    ]
                }
            ]
        },
        {
            "id": "estudiante",
            "title": "Estudiante",
            "type": "group",
            "allowed_roles": ["administrador", "estudiante"],
            "children": [
                {
                    "id": "estudiante-items",
                    "type": "collapse",
                    "children": [
                        {"id": "estudiante-comunicados", "title": "Comunicados y horarios", "type": "item", "url": "/estudiante/comunicados"}
                    ]
                }
            ]
        }
    ]
}

DEFAULT_ROUTE_PERMISSIONS = {
    "dashboard": ["administrador", "docente", "estudiante", "comite"],
    "perfil": ["administrador", "docente", "estudiante", "comite"],
    "circulares": ["administrador"],
    "circulares-archivadas": ["administrador"],
    "horarios": ["administrador"],
    "documentos": ["administrador", "docente"],
    "incapacidades": ["administrador"],
    "usuarios": ["administrador"],
    "reportes": ["administrador"],
    "comites": ["administrador"],
    "backups": ["administrador"],
    "docente-estudiantes": ["administrador", "docente"],
    "academico": ["administrador", "docente"],
    "asistencia": ["administrador", "docente"],
    "riesgo": ["administrador", "docente"],
    "planeamientos": ["administrador", "docente"],
    "comunicados": ["administrador", "docente"],
    "docente-circulares": ["administrador", "docente"],
    "docente-horario": ["administrador", "docente"],
    "docente-incapacidades": ["administrador", "docente"],
    "exportaciones": ["administrador", "docente"],
    "comite-actas": ["administrador", "comite"],
    "comite-reuniones": ["administrador", "comite"],
    "comite-roles": ["administrador", "comite"],
    "auxiliares-informes": ["administrador"],
    "auxiliares-reglamentos": ["administrador"],
    "auxiliares-cumplimiento": ["administrador"],
    "estudiante-comunicados": ["administrador", "estudiante"]
}

DEFAULT_CATALOGS = {
    "comites_tipos": [
        {"value": "institucional", "label": "Institucional"},
        {"value": "disciplinario", "label": "Disciplinario"},
        {"value": "evaluacion", "label": "Evaluacion"},
        {"value": "apoyo", "label": "Apoyo"},
        {"value": "especial", "label": "Especial"}
    ],
    "comites_estados": [
        {"value": "activo", "label": "Activo"},
        {"value": "inactivo", "label": "Inactivo"},
        {"value": "disuelto", "label": "Disuelto"}
    ],
    "comites_roles_disponibles": [
        {"value": "Presidente", "label": "Presidente", "unique": True},
        {"value": "Secretario", "label": "Secretario", "unique": True},
        {"value": "Vocal", "label": "Vocal", "unique": False},
        {"value": "Tesorero", "label": "Tesorero", "unique": True},
        {"value": "Miembro", "label": "Miembro", "unique": False}
    ],
    "circulares_destinatarios": [
        {"id": "docentes", "label": "Docentes"},
        {"id": "estudiantes", "label": "Estudiantes"}
    ],
    "circulares_tipos": [
        {"value": "informativo", "label": "Informativo"},
        {"value": "urgente", "label": "Urgente"},
        {"value": "evento", "label": "Evento"},
        {"value": "aviso", "label": "Aviso"},
        {"value": "administrativo", "label": "Administrativo"},
        {"value": "otros", "label": "Otros"}
    ],
    "circulares_estados": [
        {"value": "Publicado", "label": "Publicado"},
        {"value": "Borrador", "label": "Borrador"},
        {"value": "Archivado", "label": "Archivado"},
        {"value": "Inactivo", "label": "Inactivo"}
    ],
    "circulares_categorias": [
        {"value": "Institucional", "label": "Institucional"},
        {"value": "General", "label": "General"}
    ],
    "horarios_estados": [
        {"value": "Publicado", "label": "Publicado"},
        {"value": "Borrador", "label": "Borrador"},
        {"value": "Inactivo", "label": "Inactivo"}
    ],
    "retencion_politicas": [
        {"id": 1, "nombre": "Circulares publicadas", "retencion": "12 meses", "accion": "Archivar", "alcance": "Todos"},
        {"id": 2, "nombre": "Backups incrementales", "retencion": "30 dias", "accion": "Borrar", "alcance": "Admin"},
        {"id": 3, "nombre": "Actas de comite", "retencion": "Indefinido", "accion": "Guardar", "alcance": "Comite"}
    ],
    "filtro_estado_usuario": [
        {"value": "activo", "label": "Activos"},
        {"value": "inactivo", "label": "Inactivos"}
    ]
}

DEFAULT_BRANDING = {
    "app_name": "EduConnect",
    "institution_name": "Escuela Manuela Santamaria Rodriguez",
    "logo_url": "https://www.arcgis.com/sharing/rest/content/items/9c260e88f4cf4841ae1dcbbaa7f8db4f/resources/images/widget_2/1753990272849.jpg"
}

DEFAULT_PUBLIC_NAV = [
    {"to": "/", "label": "Inicio"},
    {"to": "/login", "label": "Iniciar sesion"},
    {"to": "/register", "label": "Registrarse"}
]

DEFAULT_CONFIGURATION_MAP = {
    "navigation": {
        "descripcion": "Navegacion principal por rol para el frontend",
        "valor": DEFAULT_NAVIGATION,
    },
    "route_permissions": {
        "descripcion": "Matriz de autorizacion por ruta para RequireAuth",
        "valor": DEFAULT_ROUTE_PERMISSIONS,
    },
    "catalogs": {
        "descripcion": "Catalogos funcionales del negocio consumidos por el frontend",
        "valor": DEFAULT_CATALOGS,
    },
    "branding": {
        "descripcion": "Branding institucional configurable",
        "valor": DEFAULT_BRANDING,
    },
    "public_nav": {
        "descripcion": "Navegacion publica del layout de autenticacion",
        "valor": DEFAULT_PUBLIC_NAV,
    },
}

DEFAULT_MODULES = ["admin", "docente", "estudiante", "comite", "auxiliares"]
DEFAULT_ACTIONS = ["create", "read", "update", "delete"]

DEFAULT_ROLE_CONFIG = {
    "administrador": {
        "descripcion": "Administrador del sistema con acceso total",
        "tipo_rol": "admin",
        "permisos": [
            "admin_create", "admin_read", "admin_update", "admin_delete",
            "docente_create", "docente_read", "docente_update", "docente_delete",
            "estudiante_create", "estudiante_read", "estudiante_update", "estudiante_delete",
            "comite_create", "comite_read", "comite_update", "comite_delete",
            "auxiliares_create", "auxiliares_read", "auxiliares_update", "auxiliares_delete",
        ],
    },
    "docente": {
        "descripcion": "Rol para docentes",
        "tipo_rol": "docente",
        "permisos": [
            "docente_create", "docente_read", "docente_update",
            "estudiante_read", "comite_read", "auxiliares_read",
        ],
    },
    "estudiante": {
        "descripcion": "Rol para estudiantes",
        "tipo_rol": "estudiante",
        "permisos": ["estudiante_read"],
    },
    "comite": {
        "descripcion": "Rol para miembros de comites",
        "tipo_rol": "comite",
        "permisos": [
            "comite_create", "comite_read", "comite_update", "comite_delete",
            "docente_read", "estudiante_read",
        ],
    },
    "auxiliares": {
        "descripcion": "Rol para organos auxiliares",
        "tipo_rol": "auxiliares",
        "permisos": [
            "auxiliares_create", "auxiliares_read", "auxiliares_update",
            "docente_read", "estudiante_read",
        ],
    },
}
