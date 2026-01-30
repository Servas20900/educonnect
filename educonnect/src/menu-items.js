// Menu structured by modules: each top-level item is a group (module)
// with a single collapse that contains the module's pages as items.
import { ROLES } from './constants/roles';

const menuItems = {
  items: [
    {
      id: 'admin',
      title: 'Admin',
      type: 'group',
      allowedRoles: [ROLES.ADMIN],
      children: [
        {
          id: 'admin-collapse',
          title: 'Administración',
          type: 'collapse',
          children: [
            { id: 'dashboard', title: 'Dashboard', type: 'item', url: '/dashboard' },
            { id: 'circulares', title: 'Circulares', type: 'item', url: '/circulares' },
            { id: 'programacion-circulares', title: 'Programación', type: 'item', url: '/circulares/programacion' },
            { id: 'horarios', title: 'Horarios', type: 'item', url: '/horarios' },
            { id: 'aprobaciones-horarios', title: 'Aprobaciones', type: 'item', url: '/horarios/aprobaciones' },
            { id: 'reportes', title: 'Reportes', type: 'item', url: '/reportes' },
            { id: 'permisos', title: 'Usuarios y Permisos', type: 'item', url: '/permisos' },
            { id: 'incapacidades', title: 'Incapacidades', type: 'item', url: '/incapacidades'},
            { id: 'comite', title: 'Comites', type: 'item', url: '/comites'},
            { id: 'oficios', title: 'Oficios/Plantillas', type: 'item', url: '/oficios'},
            { id: 'repositorios', title: 'Repositorios', type: 'item', url: '/repositorios'},
            { id: 'backups', title: 'Backups', type: 'item', url: '/backups'},
            { id: 'retencion', title: 'Retención', type: 'item', url: '/retencion'}          ]
        }
      ]
    },
    {
      id: 'docente',
      title: 'Docente',
      type: 'group',
      allowedRoles: [ROLES.ADMIN, ROLES.DOCENTE],
      children: [
        {
          id: 'docente-collapse',
          title: 'Docente',
          type: 'collapse',
          children: [
            { id: 'docente-dashboard', title: 'Dashboard', type: 'item', url: '/docente/dashboard' },
            { id: 'docente-estudiantes', title: 'Estudiantes', type: 'item', url: '/docente/estudiantes' },
            { id: 'evaluaciones', title: 'Evaluaciones', type: 'item', url: '/docente/evaluaciones' },
            { id: 'calificaciones', title: 'Calificaciones', type: 'item', url: '/docente/calificaciones' },
            { id: 'promedios', title: 'Promedios', type: 'item', url: '/docente/promedios' },
            { id: 'planeamientos', title: 'Planeamientos', type: 'item', url: '/docente/planeamientos' },
            { id: 'comunicados', title: 'Comunicados', type: 'item', url: '/docente/comunicados' },
            { id: 'asistencia', title: 'Asistencia', type: 'item', url: '/docente/asistencia' },
            { id: 'exportaciones', title: 'Exportaciones', type: 'item', url: '/docente/exportaciones' },
            { id: 'riesgo', title: 'Estudiantes en Riesgo', type: 'item', url: '/docente/riesgo' }
          ]
        }
      ]
    },
    {
      id: 'comites',
      title: 'Comites',
      type: 'group',
      allowedRoles: [ROLES.ADMIN, ROLES.DOCENTE],
      children: [
        {
          id: 'comites-collapse',
          title: 'Comites',
          type: 'collapse',
          children: [
            { id: 'comite-home', title: 'Home', type: 'item', url: '/comite/home' },
            { id: 'crear-acta', title: 'Crear Actas', type: 'item', url: '/comite/crear-acta' },
            { id: 'agendar-reunion', title: 'Agendar Reunion', type: 'item', url: '/comite/reunion' },
            { id: 'roles-comite', title: 'Roles', type: 'item', url: '/comite/roles' }
          ]
        }
      ]
    },
    {
      id: 'auxiliares',
      title: 'Órganos Auxiliares',
      type: 'group',
      allowedRoles: [ROLES.ADMIN],
      children: [
        {
          id: 'auxiliares-collapse',
          title: 'Auxiliares',
          type: 'collapse',
          children: [
            { id: 'informes-economicos', title: 'Informes Económicos', type: 'item', url: '/auxiliares/informes-economicos' },
            { id: 'reglamentos', title: 'Reglamentos', type: 'item', url: '/auxiliares/reglamentos' },
            { id: 'informes-pat', title: 'Informes PAT', type: 'item', url: '/auxiliares/informes-pat' },
            { id: 'reportes-cumplimiento', title: 'Reportes Cumplimiento', type: 'item', url: '/auxiliares/reportes-cumplimiento' }
          ]
        }
      ]
    },
    {
      id: 'estudiante',
      title: 'Estudiante',
      type: 'group',
      allowedRoles: [ROLES.ADMIN, ROLES.ESTUDIANTE],
      children: [
        {
          id: 'estudiante-collapse',
          title: 'Estudiante',
          type: 'collapse',
          children: [
            { id: 'estudiante-home', title: 'Home', type: 'item', url: '/estudiante/home' },
            { id: 'notificaciones', title: 'Notificaciones', type: 'item', url: '/estudiante/notificaciones' },
            { id: 'circulares-horarios', title: 'Circulares y Horarios', type: 'item', url: '/estudiante/circulares_horarios'}
          ]
        }
      ]
    }
  ]
};

export default menuItems;
