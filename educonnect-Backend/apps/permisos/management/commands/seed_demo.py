import random
from datetime import date, datetime, timedelta
from decimal import Decimal

from django.contrib.contenttypes.models import ContentType
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.asistencia.models import AsistenciaDetalle, AsistenciaRegistro
from apps.databaseModels.models import (
    AcademicoAsignatura,
    AcademicoAsignaturaGrado,
    AcademicoDocenteGrupo,
    AcademicoGrado,
    AcademicoGrupo,
    AcademicoMatricula,
    AcademicoPeriodo,
    AcademicoSeccion,
    AuthRol,
    AuthUsuario,
    AuthUsuarioRol,
    ComitesActa,
    ComitesComite,
    ComitesMiembro,
    ComitesOrganoAuxiliar,
    ComitesReunion,
    ComunicacionesCircular,
    ComunicacionesComunicado,
    ComunicacionesNotificacion,
    DocumentosDocumento,
    DocumentosRepositorio,
    EvaluacionesCalificacion,
    EvaluacionesEvaluacion,
    EvaluacionesPromedio,
    HorariosDetalle,
    HorariosHorario,
    PersonasDocente,
    PersonasEncargado,
    PersonasEstudiante,
    PersonasEstudianteEncargado,
    PersonasPersona,
    PersonasPersonaRol,
)
from apps.informesEconomicos.models import PatronatoInforme
from apps.planeamientos.models import Planeamiento


class Command(BaseCommand):
    help = "Seed de demo con volumen alto de usuarios y datos funcionales (idempotente)."
    FIRST_NAMES = [
        "Ana", "Luis", "Carlos", "Maria", "Jose", "Laura", "Diego", "Sofia",
        "Andres", "Elena", "Miguel", "Paula", "Jorge", "Camila", "Kevin", "Natalia",
        "Fabian", "Valeria", "Daniel", "Irene", "Rafael", "Lucia", "Marco", "Andrea",
    ]
    LAST_NAMES = [
        "Ramirez", "Vargas", "Solis", "Mora", "Quesada", "Lopez", "Rojas", "Castro",
        "Alvarado", "Herrera", "Fernandez", "Jimenez", "Ruiz", "Chaves", "Navarro", "Mendez",
    ]
    DEMO_FILE_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"

    def add_arguments(self, parser):
        parser.add_argument("--year", type=int, default=date.today().year)
        parser.add_argument("--docentes", type=int, default=12)
        parser.add_argument("--estudiantes", type=int, default=80)
        parser.add_argument("--encargados", type=int, default=35)
        parser.add_argument("--comite-users", type=int, default=6)
        parser.add_argument("--auxiliares-users", type=int, default=4)
        parser.add_argument("--seed", type=int, default=42)
        parser.add_argument("--password", type=str, default="educonnect123")

    @transaction.atomic
    def handle(self, *args, **options):
        random.seed(options["seed"])

        self.stdout.write(self.style.NOTICE("Iniciando seed_demo..."))

        call_command("seed_system")

        roles = self._roles_map()
        admin = AuthUsuario.objects.get(username="admin")
        admin.email = "admin@mep.go.cr"
        admin.set_password(options["password"])
        admin.save(update_fields=["email", "password"])

        periodo = self._ensure_periodo(options["year"])
        secciones = self._ensure_secciones()
        grados = list(AcademicoGrado.objects.filter(activo=True).order_by("numero_grado"))

        asignaturas = self._ensure_asignaturas(grados)
        docentes = self._ensure_docentes(options["docentes"], roles, admin, options["password"])
        estudiantes = self._ensure_estudiantes(options["estudiantes"], roles, admin, options["password"])
        encargados = self._ensure_encargados(options["encargados"], admin)
        self._link_estudiante_encargado(estudiantes, encargados)

        comite_users = self._ensure_role_users(
            prefix="comite",
            domain="mep.go.cr",
            count=options["comite_users"],
            role=roles["comite"],
            admin=admin,
            base_id=70000000,
            password=options["password"],
        )
        auxiliares_users = self._ensure_role_users(
            prefix="auxiliar",
            domain="mep.go.cr",
            count=options["auxiliares_users"],
            role=roles["auxiliares"],
            admin=admin,
            base_id=80000000,
            password=options["password"],
        )

        grupos = self._ensure_grupos(periodo, grados, secciones, docentes)
        docente_grupos = self._ensure_docente_grupo_asignatura(grupos, docentes, asignaturas)
        self._ensure_matriculas(grupos, estudiantes)

        self._ensure_circulares(admin, total=12)
        self._ensure_comunicados(admin, total=10)
        self._ensure_horarios(grupos, docentes, asignaturas, admin)
        self._ensure_asistencia(grupos, docentes)
        self._ensure_evaluaciones(docente_grupos, admin)
        self._ensure_comites(periodo, comite_users, admin)
        self._ensure_organo_auxiliar(periodo, auxiliares_users, admin)
        self._ensure_notificaciones(admin, docentes, comite_users, auxiliares_users)
        self._ensure_repositorios_documentos(admin)
        self._ensure_planeamientos(docentes, admin)
        self._ensure_informes_reglamentos(auxiliares_users, admin)

        self.stdout.write(self.style.SUCCESS("seed_demo completado correctamente."))

    def _roles_map(self):
        role_names = ["administrador", "docente", "estudiante", "comite", "auxiliares"]
        roles = AuthRol.objects.filter(nombre__in=role_names)
        role_map = {r.nombre: r for r in roles}
        missing = [name for name in role_names if name not in role_map]
        if missing:
            raise ValueError(f"Faltan roles requeridos: {missing}")
        return role_map

    def _ensure_periodo(self, year):
        periodo, _ = AcademicoPeriodo.objects.update_or_create(
            año_lectivo=year,
            tipo_periodo="anual",
            numero_periodo=1,
            defaults={
                "nombre": f"Lectivo {year}",
                "fecha_inicio": date(year, 2, 1),
                "fecha_fin": date(year, 12, 15),
                "estado": "activo",
                "fecha_creacion": timezone.now(),
                "fecha_modificacion": timezone.now(),
            },
        )
        return periodo

    def _ensure_secciones(self):
        secciones = []
        for idx, code in enumerate(["A", "B", "C"], start=1):
            seccion, _ = AcademicoSeccion.objects.update_or_create(
                codigo=code,
                defaults={
                    "nombre": f"Seccion {code}",
                    "descripcion": f"Seccion {code} para distribucion demo",
                    "capacidad_maxima": 30 + (idx * 2),
                    "activo": True,
                },
            )
            secciones.append(seccion)
        return secciones

    def _ensure_asignaturas(self, grados):
        base = [
            ("MAT", "Matematica", "ciencias"),
            ("ESP", "Espanol", "lenguaje"),
            ("CIE", "Ciencias", "ciencias"),
            ("SOC", "Estudios Sociales", "sociales"),
            ("ING", "Ingles", "idiomas"),
            ("ART", "Arte", "artistica"),
            ("MUS", "Musica", "artistica"),
            ("EFI", "Educacion Fisica", "deportes"),
            ("INF", "Informatica", "tecnologia"),
            ("CIV", "Civica", "sociales"),
        ]

        asignaturas = []
        for idx, (code, nombre, area) in enumerate(base, start=1):
            asig, _ = AcademicoAsignatura.objects.update_or_create(
                codigo=code,
                defaults={
                    "nombre": nombre,
                    "area": area,
                    "descripcion": f"Asignatura de {nombre}",
                    "horas_semanales": 2 + (idx % 3),
                    "activo": True,
                    "fecha_creacion": timezone.now(),
                    "fecha_modificacion": timezone.now(),
                },
            )
            asignaturas.append(asig)

        for grado in grados:
            for asig in asignaturas:
                AcademicoAsignaturaGrado.objects.update_or_create(
                    asignatura=asig,
                    grado=grado,
                    defaults={
                        "horas_semanales": asig.horas_semanales,
                        "obligatoria": True,
                    },
                )
        return asignaturas

    def _create_persona(self, *, identificacion, nombre, ap1, ap2, email, creado_por):
        persona, _ = PersonasPersona.objects.update_or_create(
            identificacion=identificacion,
            defaults={
                "tipo_identificacion": "cedula",
                "nombre": nombre,
                "primer_apellido": ap1,
                "segundo_apellido": ap2,
                "fecha_nacimiento": date(1990, 1, 1),
                "genero": "No especificado",
                "nacionalidad": "Costarricense",
                "telefono_principal": "88888888",
                "telefono_secundario": "22222222",
                "email_personal": email,
                "email_institucional": email,
                "direccion_exacta": "Direccion demo",
                "provincia": "San Jose",
                "canton": "Central",
                "distrito": "Carmen",
                "estado_civil": "Soltero",
                "notas": "Registro demo",
                "activo": True,
                "fecha_modificacion": timezone.now(),
                "creado_por": creado_por,
            },
        )
        return persona

    def _create_user_with_role(self, *, username, email, password, persona, role, admin, active=True):
        user = AuthUsuario.objects.filter(persona=persona).first()
        created = False

        if not user:
            user, created = AuthUsuario.objects.get_or_create(
                username=username,
                defaults={
                    "email": email,
                    "persona": persona,
                    "is_active": active,
                },
            )

        update_fields = []
        if user.username != username:
            user.username = username
            update_fields.append("username")
        if user.email != email:
            user.email = email
            update_fields.append("email")
        if user.persona_id != persona.id:
            user.persona = persona
            update_fields.append("persona")
        if user.is_active != active:
            user.is_active = active
            update_fields.append("is_active")

        if update_fields:
            user.save(update_fields=update_fields)

        # For demo consistency, all seeded users share the same known password.
        user.set_password(password)
        user.save(update_fields=["password"])

        AuthUsuarioRol.objects.get_or_create(
            usuario=user,
            rol=role,
            defaults={"fecha_asignacion": timezone.now(), "asignado_por": admin},
        )
        PersonasPersonaRol.objects.get_or_create(
            persona=persona,
            rol=role,
            defaults={"fecha_asignacion": timezone.now()},
        )
        return user

    def _random_person_name(self):
        return (
            random.choice(self.FIRST_NAMES),
            random.choice(self.LAST_NAMES),
            random.choice(self.LAST_NAMES),
        )

    def _ensure_docentes(self, count, roles, admin, password):
        docentes = []
        for i in range(1, count + 1):
            nombre, ap1, ap2 = self._random_person_name()
            username = f"doc_{i:03d}_{nombre.lower()}"
            email = f"{username}@mep.go.cr"
            persona = self._create_persona(
                identificacion=f"1{i:08d}",
                nombre=nombre,
                ap1=ap1,
                ap2=ap2,
                email=email,
                creado_por=admin,
            )
            user = self._create_user_with_role(
                username=username,
                email=email,
                password=password,
                persona=persona,
                role=roles["docente"],
                admin=admin,
                active=i <= max(2, int(count * 0.9)),
            )
            PersonasDocente.objects.update_or_create(
                persona=persona,
                defaults={
                    "codigo_empleado": f"DOC-{i:04d}",
                    "especialidad": "General",
                    "nivel_academico": "Licenciatura",
                    "fecha_ingreso": date.today() - timedelta(days=365 * 2),
                    "estado_laboral": "activo" if user.is_active else "inactivo",
                    "tipo_contrato": "propiedad",
                    "horas_contratadas": 40,
                    "salario_base": Decimal("850000.00"),
                    "numero_cuenta_bancaria": f"CR{i:018d}",
                    "titulo_profesional": "Licenciatura en Educacion",
                    "universidad": "Universidad Demo",
                    "año_graduacion": 2018,
                },
            )
            docentes.append(user)
        return docentes

    def _ensure_estudiantes(self, count, roles, admin, password):
        estudiantes = []
        for i in range(1, count + 1):
            nombre, ap1, ap2 = self._random_person_name()
            username = f"est_{i:03d}_{nombre.lower()}"
            email = f"{username}@est.mep.go.cr"
            persona = self._create_persona(
                identificacion=f"2{i:08d}",
                nombre=nombre,
                ap1=ap1,
                ap2=ap2,
                email=email,
                creado_por=admin,
            )
            self._create_user_with_role(
                username=username,
                email=email,
                password=password,
                persona=persona,
                role=roles["estudiante"],
                admin=admin,
                active=True,
            )
            est, _ = PersonasEstudiante.objects.update_or_create(
                persona=persona,
                defaults={
                    "codigo_estudiante": f"EST-{i:05d}",
                    "fecha_ingreso": date.today() - timedelta(days=365),
                    "estado_estudiante": "activo",
                    "tipo_estudiante": "regular",
                    "condicion_especial": "ninguna",
                    "beca": i % 7 == 0,
                    "tipo_beca": "socioeconomica" if i % 7 == 0 else "ninguna",
                    "porcentaje_beca": Decimal("50.00") if i % 7 == 0 else Decimal("0.00"),
                    "tiene_adecuacion": i % 9 == 0,
                    "tipo_adecuacion": "curricular" if i % 9 == 0 else "ninguna",
                },
            )
            estudiantes.append(est)
        return estudiantes

    def _ensure_encargados(self, count, admin):
        encargados = []
        for i in range(1, count + 1):
            nombre, ap1, ap2 = self._random_person_name()
            email = f"encargado{i:03d}@mep.go.cr"
            persona = self._create_persona(
                identificacion=f"3{i:08d}",
                nombre=nombre,
                ap1=ap1,
                ap2=ap2,
                email=email,
                creado_por=admin,
            )
            enc, _ = PersonasEncargado.objects.update_or_create(
                persona=persona,
                defaults={
                    "parentesco": "Madre" if i % 2 == 0 else "Padre",
                    "ocupacion": "Trabajador",
                    "lugar_trabajo": "Empresa Demo",
                    "telefono_trabajo": "22220000",
                    "es_responsable_economico": i % 2 == 0,
                    "es_contacto_emergencia": True,
                    "nivel_educativo": "Secundaria",
                },
            )
            encargados.append(enc)
        return encargados

    def _link_estudiante_encargado(self, estudiantes, encargados):
        if not encargados:
            return
        for idx, est in enumerate(estudiantes):
            principal = encargados[idx % len(encargados)]
            PersonasEstudianteEncargado.objects.update_or_create(
                estudiante=est,
                encargado=principal,
                defaults={
                    "tipo_relacion": "Representante legal",
                    "prioridad": 1,
                    "fecha_asignacion": timezone.now(),
                    "activo": True,
                },
            )
            if idx % 5 == 0:
                secundario = encargados[(idx + 1) % len(encargados)]
                PersonasEstudianteEncargado.objects.update_or_create(
                    estudiante=est,
                    encargado=secundario,
                    defaults={
                        "tipo_relacion": "Contacto emergencia",
                        "prioridad": 2,
                        "fecha_asignacion": timezone.now(),
                        "activo": True,
                    },
                )

    def _ensure_role_users(self, *, prefix, domain, count, role, admin, base_id, password):
        users = []
        for i in range(1, count + 1):
            nombre, ap1, ap2 = self._random_person_name()
            short_prefix = "com" if prefix == "comite" else "aux"
            username = f"{short_prefix}_{i:03d}_{nombre.lower()}"
            email = f"{username}@{domain}"
            persona = self._create_persona(
                identificacion=str(base_id + i),
                nombre=nombre,
                ap1=ap1,
                ap2=ap2,
                email=email,
                creado_por=admin,
            )
            user = self._create_user_with_role(
                username=username,
                email=email,
                password=password,
                persona=persona,
                role=role,
                admin=admin,
                active=True,
            )
            users.append(user)
        return users

    def _ensure_grupos(self, periodo, grados, secciones, docentes):
        grupos = []
        docente_objs = {
            d.persona_id: d
            for d in PersonasDocente.objects.filter(persona_id__in=[u.persona_id for u in docentes])
        }
        seccion_a = next((s for s in secciones if s.codigo == "A"), secciones[0])
        seccion_b = next((s for s in secciones if s.codigo == "B"), secciones[0])

        for idx, grado in enumerate(grados, start=1):
            for sec in [seccion_a, seccion_b if idx % 2 == 1 else seccion_a]:
                codigo = f"{grado.numero_grado}{sec.codigo}-{periodo.año_lectivo}"
                docente_user = docentes[(idx + ord(sec.codigo)) % len(docentes)]
                docente_guia = docente_objs.get(docente_user.persona_id)

                grupo, _ = AcademicoGrupo.objects.update_or_create(
                    periodo=periodo,
                    grado=grado,
                    seccion=sec,
                    defaults={
                        "docente_guia": docente_guia,
                        "nombre": f"{grado.nombre} {sec.codigo}",
                        "codigo_grupo": codigo,
                        "aula": f"A-{idx}{sec.codigo}",
                        "estado": "activo",
                        "fecha_creacion": timezone.now(),
                        "fecha_modificacion": timezone.now(),
                    },
                )
                grupos.append(grupo)
        return grupos

    def _ensure_docente_grupo_asignatura(self, grupos, docentes, asignaturas):
        docente_objs = {
            d.persona_id: d
            for d in PersonasDocente.objects.filter(persona_id__in=[u.persona_id for u in docentes])
        }
        result = []
        for idx, grupo in enumerate(grupos):
            for slot in range(2):
                user_docente = docentes[(idx + slot) % len(docentes)]
                docente = docente_objs.get(user_docente.persona_id)
                asig = asignaturas[(idx + slot) % len(asignaturas)]

                dg, _ = AcademicoDocenteGrupo.objects.update_or_create(
                    docente=docente,
                    grupo=grupo,
                    asignatura=asig,
                    defaults={
                        "horas_semanales": 3,
                        "fecha_inicio": date.today() - timedelta(days=30),
                        "fecha_fin": None,
                        "activo": True,
                        "fecha_asignacion": timezone.now(),
                    },
                )
                result.append(dg)
        return result

    def _ensure_matriculas(self, grupos, estudiantes):
        if not grupos or not estudiantes:
            return
        for idx, est in enumerate(estudiantes):
            grupo = grupos[idx % len(grupos)]
            AcademicoMatricula.objects.update_or_create(
                estudiante=est,
                grupo=grupo,
                defaults={
                    "fecha_matricula": date.today() - timedelta(days=60),
                    "estado": "activo",
                    "observaciones": "Matricula demo",
                },
            )

    def _ensure_circulares(self, admin, total=12):
        estados = ["Publicado", "Borrador", "Archivado"]
        destinatarios = [["docentes"], ["estudiantes"], ["docentes", "estudiantes"]]
        for i in range(1, total + 1):
            ComunicacionesCircular.objects.update_or_create(
                titulo=f"Circular demo {i:02d}",
                defaults={
                    "contenido": f"Contenido de la circular demo {i}.",
                    "detalle": "Detalle de apoyo para presentacion.",
                    "tipo_comunicado": "informativo",
                    "destinatarios": destinatarios[i % len(destinatarios)],
                    "visible": True,
                    "fecha_vigencia_inicio": date.today() - timedelta(days=i),
                    "fecha_vigencia_fin": date.today() + timedelta(days=30),
                    "estado": estados[i % len(estados)],
                    "categoria": "Institucional",
                    "creada_por": admin,
                },
            )

    def _ensure_comunicados(self, admin, total=10):
        tipos = ["informativo", "urgente", "evento", "aviso"]
        for i in range(1, total + 1):
            ComunicacionesComunicado.objects.update_or_create(
                titulo=f"Comunicado demo {i:02d}",
                defaults={
                    "contenido": f"Mensaje demo {i} para poblar sistema.",
                    "tipo_comunicado": tipos[i % len(tipos)],
                    "destinatarios": ["docente", "estudiante"] if i % 2 == 0 else ["docente"],
                    "fecha_publicacion": timezone.now() - timedelta(days=i),
                    "fecha_vigencia": timezone.now() + timedelta(days=15),
                    "visible": i % 5 != 0,
                    "publicado_por": admin,
                },
            )

    def _ensure_horarios(self, grupos, docentes, asignaturas, admin):
        for idx, grupo in enumerate(grupos[:12]):
            docente = docentes[idx % len(docentes)]
            horario, _ = HorariosHorario.objects.update_or_create(
                nombre=f"Horario {grupo.nombre}",
                grupo=grupo,
                defaults={
                    "docente": docente,
                    "tipo_horario": "grupo",
                    "version": 1,
                    "estado": "Publicado",
                    "fecha_vigencia_inicio": date.today() - timedelta(days=10),
                    "fecha_vigencia_fin": date.today() + timedelta(days=120),
                    "notas": "Horario de demo",
                    "creado_por": admin,
                    "fecha_modificacion": timezone.now(),
                },
            )

            for d_idx, dia in enumerate(["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"]):
                asig = asignaturas[(idx + d_idx) % len(asignaturas)]
                hi = datetime.strptime(f"{7 + d_idx:02d}:00", "%H:%M").time()
                hf = datetime.strptime(f"{8 + d_idx:02d}:00", "%H:%M").time()
                HorariosDetalle.objects.update_or_create(
                    horario=horario,
                    dia_semana=dia,
                    hora_inicio=hi,
                    hora_fin=hf,
                    defaults={
                        "asignatura": asig,
                        "docente": docente,
                        "aula": grupo.aula,
                        "notas": "Bloque demo",
                    },
                )

    def _ensure_asistencia(self, grupos, docentes):
        for idx, grupo in enumerate(grupos[:8]):
            docente = docentes[idx % len(docentes)]
            fecha = date.today() - timedelta(days=(idx % 5) + 1)
            registro, _ = AsistenciaRegistro.objects.update_or_create(
                grupo=grupo,
                fecha=fecha,
                defaults={
                    "docente": docente,
                    "cerrado": idx % 3 == 0,
                },
            )

            matriculas = AcademicoMatricula.objects.filter(grupo=grupo, estado="activo").select_related("estudiante")[:25]
            for m_idx, mat in enumerate(matriculas):
                estado = ["presente", "ausente", "tardia"][m_idx % 3]
                AsistenciaDetalle.objects.update_or_create(
                    registro=registro,
                    estudiante=mat.estudiante,
                    defaults={
                        "estado": estado,
                        "justificada": estado == "ausente" and m_idx % 2 == 0,
                        "observacion": "Registro demo",
                    },
                )

    def _ensure_evaluaciones(self, docente_grupos, admin):
        if not docente_grupos:
            return

        for idx, dg in enumerate(docente_grupos[:12]):
            evaluacion, _ = EvaluacionesEvaluacion.objects.update_or_create(
                docente_grupo=dg,
                nombre=f"Evaluacion demo {idx + 1:02d}",
                defaults={
                    "descripcion": "Evaluacion generada para demo",
                    "tipo_evaluacion": "actividad",
                    "fecha_evaluacion": date.today() - timedelta(days=idx + 2),
                    "fecha_entrega": date.today() + timedelta(days=10),
                    "valor_porcentual": Decimal("10.00"),
                    "nota_maxima": Decimal("100.00"),
                    "rubrica": {"criterio": "Participacion"},
                    "instrucciones": "Completar actividad en clase",
                    "visible_estudiantes": True,
                    "permite_recuperacion": True,
                    "fecha_creacion": timezone.now() - timedelta(days=7),
                    "fecha_modificacion": timezone.now(),
                },
            )

            matriculas = AcademicoMatricula.objects.filter(grupo=dg.grupo, estado="activo").select_related("estudiante")[:25]
            for m_idx, mat in enumerate(matriculas):
                nota = Decimal(str(60 + ((m_idx * 3) % 41)))
                EvaluacionesCalificacion.objects.update_or_create(
                    evaluacion=evaluacion,
                    estudiante=mat.estudiante,
                    defaults={
                        "nota": nota,
                        "estado": "registrada",
                        "ausente": False,
                        "justificado": False,
                        "observaciones": "Nota de demo",
                        "fecha_registro": timezone.now(),
                        "registrada_por": admin,
                    },
                )

                EvaluacionesPromedio.objects.update_or_create(
                    estudiante=mat.estudiante,
                    docente_grupo=dg,
                    periodo=dg.grupo.periodo,
                    defaults={
                        "promedio": Decimal("78.50"),
                        "total_ausencias": m_idx % 4,
                        "total_tardias": m_idx % 3,
                        "notas_adicionales": "Promedio demo",
                        "fecha_calculo": timezone.now(),
                    },
                )

    def _ensure_comites(self, periodo, comite_users, admin):
        personas = [u.persona for u in comite_users if u.persona_id]
        if not personas:
            return

        comites = []
        for i in range(1, 4):
            comite, _ = ComitesComite.objects.update_or_create(
                nombre=f"Comite Demo {i}",
                defaults={
                    "tipo_comite": "institucional",
                    "descripcion": "Comite para demostracion",
                    "objetivos": "Coordinar acciones escolares",
                    "periodo": periodo,
                    "fecha_creacion": date.today() - timedelta(days=90),
                    "estado": "activo",
                    "reglamento": "Reglamento base de demo",
                },
            )
            comites.append(comite)

        cargos = ["Presidente", "Secretario", "Vocal"]
        for idx, comite in enumerate(comites):
            for jdx, persona in enumerate(personas[:3]):
                ComitesMiembro.objects.update_or_create(
                    comite=comite,
                    persona=persona,
                    defaults={
                        "cargo": cargos[jdx % len(cargos)],
                        "fecha_nombramiento": date.today() - timedelta(days=60),
                        "activo": True,
                    },
                )

        for i in range(1, 6):
            convocante = comite_users[i % len(comite_users)]
            reunion, _ = ComitesReunion.objects.update_or_create(
                fecha=date.today() - timedelta(days=i * 7),
                tema=f"Sesion demo {i}",
                defaults={
                    "hora_inicio": datetime.strptime("15:00", "%H:%M").time(),
                    "hora_fin": datetime.strptime("16:30", "%H:%M").time(),
                    "asistentes": [p.id for p in personas[:3]],
                    "convocada_por": convocante,
                    "estado": "realizada",
                    "lugar": "Sala de reuniones",
                },
            )

            ComitesActa.objects.update_or_create(
                reunion=reunion,
                defaults={
                    "numero_acta": f"ACTA-{i:03d}",
                    "contenido": "Contenido del acta demo",
                    "acuerdos": "Acuerdos de seguimiento",
                    "seguimientos": "Pendiente de ejecutar",
                    "estado": "aprobada",
                    "elaborada_por": convocante,
                    "aprobada_por": admin,
                    "fecha_elaboracion": timezone.now() - timedelta(days=i * 6),
                    "fecha_aprobacion": timezone.now() - timedelta(days=i * 5),
                },
            )

    def _ensure_organo_auxiliar(self, periodo, auxiliares_users, admin):
        if not auxiliares_users:
            return
        coordinador = auxiliares_users[0].persona

        organo, _ = ComitesOrganoAuxiliar.objects.update_or_create(
            nombre="Organo Auxiliar Demo",
            defaults={
                "tipo_organo": "patronato",
                "descripcion": "Organo auxiliar para reportes de demo",
                "periodo": periodo,
                "coordinador": coordinador,
                "fecha_creacion": date.today() - timedelta(days=120),
                "estado": "activo",
            },
        )
        _ = organo  # mantiene referencia util para futuras extensiones del seed

    def _ensure_notificaciones(self, admin, docentes, comite_users, auxiliares_users):
        recipients = [admin] + docentes[:4] + comite_users[:2] + auxiliares_users[:2]
        for idx, user in enumerate(recipients, start=1):
            ComunicacionesNotificacion.objects.update_or_create(
                usuario=user,
                titulo=f"Notificacion demo {idx:02d}",
                defaults={
                    "tipo_notificacion": "sistema",
                    "mensaje": "Mensaje de notificacion para validacion de UI.",
                    "enlace": "/dashboard",
                    "leida": idx % 3 == 0,
                    "fecha_lectura": timezone.now() if idx % 3 == 0 else None,
                    "prioridad": "alta" if idx % 4 == 0 else "media",
                    "fecha_creacion": timezone.now() - timedelta(hours=idx),
                    "fecha_expiracion": timezone.now() + timedelta(days=10),
                },
            )

    def _upsert_documento_linked(self, *, repositorio, nombre, descripcion, cargado_por, content_type, object_id, idx):
        documento = DocumentosDocumento.objects.filter(
            repositorio=repositorio,
            content_type=content_type,
            object_id=object_id,
            nombre=nombre,
            version=1,
        ).first()

        defaults = {
            "descripcion": descripcion,
            "tipo_documento": "raw",
            "ruta_archivo": self.DEMO_FILE_URL,
            "tamaño_bytes": 13264,
            "extension": "pdf",
            "mime_type": "application/pdf",
            "documento_anterior": None,
            "hash_md5": f"{idx:032x}",
            "es_version_actual": True,
            "etiquetas": {"seed": "demo"},
            "metadatos": {"source": "seed_demo", "public_id": f"seed/{nombre.lower()}"},
            "fecha_documento": date.today(),
            "fecha_carga": timezone.now(),
            "fecha_modificacion": timezone.now(),
            "cargado_por": cargado_por,
        }

        if documento:
            for key, value in defaults.items():
                setattr(documento, key, value)
            documento.save()
            return documento

        return DocumentosDocumento.objects.create(
            repositorio=repositorio,
            content_type=content_type,
            object_id=object_id,
            nombre=nombre,
            version=1,
            **defaults,
        )

    def _ensure_repositorios_documentos(self, admin):
        repos_def = [
            ("Repositorio Docente", "Documentos base para docentes", "educonnect/documentos/docentes"),
            ("Repositorio Auxiliares", "Reglamentos e informes auxiliares", "educonnect/documentos/auxiliares"),
            ("Repositorio Institucional", "Documentos de consulta institucional", "educonnect/documentos/institucional"),
        ]

        ct_repositorio = ContentType.objects.get_for_model(DocumentosRepositorio)

        for r_idx, (nombre, descripcion, path) in enumerate(repos_def, start=1):
            repo, _ = DocumentosRepositorio.objects.update_or_create(
                cloudinary_path=path,
                defaults={
                    "nombre": nombre,
                    "descripcion": descripcion,
                    "rol_acceso": "docente,administrador",
                    "puede_escribir": True,
                    "creado_por": admin,
                },
            )

            for d_idx in range(1, 5):
                doc_name = f"{nombre.replace(' ', '_').lower()}_{d_idx:02d}.pdf"
                self._upsert_documento_linked(
                    repositorio=repo,
                    nombre=doc_name,
                    descripcion=f"Documento demo {d_idx} para {nombre}",
                    cargado_por=admin,
                    content_type=ct_repositorio,
                    object_id=repo.id,
                    idx=(r_idx * 100) + d_idx,
                )

    def _ensure_planeamientos(self, docentes, admin):
        estados = ["Borrador", "En revisión", "Aprobado"]

        for idx, docente in enumerate(docentes[:12], start=1):
            estado = estados[idx % len(estados)]
            Planeamiento.objects.update_or_create(
                docente=docente,
                titulo=f"Planeamiento DOC-{idx:03d}",
                defaults={
                    "detalle": f"Planeamiento de clase generado para docente {idx}",
                    "estado": estado,
                    "archivo": "",
                    "fecha_envio": date.today() if estado in {"En revisión", "Aprobado"} else None,
                    "comentarios": idx % 4,
                    "comentario_revision": "Ajustes menores recomendados" if estado != "Borrador" else "",
                    "fecha_revision": timezone.now() if estado == "Aprobado" else None,
                    "revisado_por": admin if estado == "Aprobado" else None,
                },
            )

    def _ensure_informes_reglamentos(self, auxiliares_users, admin):
        repo, _ = DocumentosRepositorio.objects.update_or_create(
            cloudinary_path="patronato/informes",
            defaults={
                "nombre": "Informes Patronato",
                "descripcion": "Informes economicos, PAT y reglamentos",
                "rol_acceso": "docente,administrador",
                "puede_escribir": True,
                "creado_por": admin,
            },
        )

        ct_informe = ContentType.objects.get_for_model(PatronatoInforme)
        responsables = auxiliares_users if auxiliares_users else [admin]
        categorias = [
            "economico", "economico", "pat", "pat", "reglamento", "reglamento",
        ]

        for idx, categoria in enumerate(categorias, start=1):
            informe = PatronatoInforme.objects.filter(
                titulo=f"Informe {categoria.upper()} {idx:02d}",
                categoria=categoria,
            ).first()
            if not informe:
                informe = PatronatoInforme.objects.create(
                    titulo=f"Informe {categoria.upper()} {idx:02d}",
                    categoria=categoria,
                    responsable=responsables[idx % len(responsables)],
                    estado="Activo" if idx % 4 != 0 else "Archivado",
                )
            else:
                informe.responsable = responsables[idx % len(responsables)]
                informe.estado = "Activo" if idx % 4 != 0 else "Archivado"
                informe.save(update_fields=["responsable", "estado"])

            self._upsert_documento_linked(
                repositorio=repo,
                nombre=f"informe_{categoria}_{idx:02d}.pdf",
                descripcion=f"Documento respaldo para {informe.titulo}",
                cargado_por=admin,
                content_type=ct_informe,
                object_id=informe.id,
                idx=500 + idx,
            )
