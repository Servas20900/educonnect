from django.utils import timezone
from apps.databaseModels.models import (
    AcademicoMatricula,
    PersonasEstudianteEncargado,
    AuthUsuario,
    ComunicacionesNotificacion,
)
from .models import PreferenciaNotificacion


def crear_notificaciones_profesor_hogar(comunicado):
    destinatarios = comunicado.destinatarios or []

    print("=== INICIO crear_notificaciones_profesor_hogar ===")
    print("Comunicado ID:", comunicado.id)
    print("Destinatarios:", destinatarios)

    for item in destinatarios:
        print("Procesando item:", item)

        if not isinstance(item, dict):
            print("Saltado: no es dict")
            continue

        if item.get("tipo") != "profesor_hogar":
            print("Saltado: tipo no es profesor_hogar")
            continue

        grupo_id = item.get("grupo_id")
        if not grupo_id:
            print("Saltado: no tiene grupo_id")
            continue

        print("Grupo ID:", grupo_id)

        matriculas = AcademicoMatricula.objects.select_related(
            "estudiante__persona"
        ).filter(grupo_id=grupo_id)

        print("Matrículas encontradas:", matriculas.count())

        estudiantes_ids = []
        for m in matriculas:
            print("Matrícula -> estudiante_id:", m.estudiante_id, "estado:", m.estado)
            if m.estudiante_id and str(m.estado).lower() == "activo":
                estudiantes_ids.append(m.estudiante_id)

        print("Estudiantes activos IDs:", estudiantes_ids)

        if not estudiantes_ids:
            print("No hay estudiantes activos en este grupo")
            continue

        relaciones = PersonasEstudianteEncargado.objects.select_related(
            "encargado__persona"
        ).filter(
            estudiante_id__in=estudiantes_ids,
            activo=True
        )

        print("Relaciones estudiante-encargado activas:", relaciones.count())

        personas_encargados_ids = []
        for rel in relaciones:
            print(
                "Relación -> estudiante:",
                rel.estudiante_id,
                "encargado:",
                rel.encargado_id,
                "activo:",
                rel.activo,
            )
            if rel.encargado and rel.encargado.persona_id:
                personas_encargados_ids.append(rel.encargado.persona_id)

        personas_encargados_ids = list(set(personas_encargados_ids))
        print("Personas de encargados:", personas_encargados_ids)

        if not personas_encargados_ids:
            print("No se encontraron personas de encargados")
            continue

        usuarios_encargados = AuthUsuario.objects.filter(
            persona_id__in=personas_encargados_ids,
            is_active=True
        ).distinct()

        print("Usuarios encargados encontrados:", usuarios_encargados.count())
        print("Usuarios IDs:", list(usuarios_encargados.values_list("id", flat=True)))

        for usuario in usuarios_encargados:
            preferencia = getattr(usuario, "preferencia_notificacion", None)
            if preferencia and not preferencia.recibir_profesor_hogar:
                print(f"Usuario {usuario.id} desactivó profesor_hogar")
                continue

            existe = ComunicacionesNotificacion.objects.filter(
                usuario=usuario,
                tipo_notificacion="profesor_hogar",
                titulo=comunicado.titulo,
                enlace=f"/comunicados/{comunicado.id}",
            ).exists()

            if existe:
                print(f"Notificación ya existe para usuario {usuario.id}")
                continue

            ComunicacionesNotificacion.objects.create(
                usuario=usuario,
                tipo_notificacion="profesor_hogar",
                titulo=comunicado.titulo,
                mensaje=comunicado.contenido[:300],
                enlace=f"/comunicados/{comunicado.id}",
                leida=False,
                prioridad="media",
                fecha_creacion=timezone.now(),
                fecha_expiracion=None,
            )

            print(f"Notificación creada para usuario {usuario.id}")

    print("=== FIN crear_notificaciones_profesor_hogar ===")