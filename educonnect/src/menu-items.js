import { ROLES } from './constants/roles';

const menuItems = {
  items: [
    {
      id: 'admin',
      title: 'Administración',
      type: 'group',
      allowedRoles: [ROLES.ADMIN],
      children: [
        {
          id: 'admin-items',
          type: 'collapse',
          children: [
            { id: 'dashboard',      title: 'Dashboard',          type: 'item', url: '/dashboard' },
            { id: 'circulares',     title: 'Circulares',         type: 'item', url: '/circulares' },
            { id: 'horarios',       title: 'Horarios',           type: 'item', url: '/horarios' },
            { id: 'documentos',     title: 'Documentos',         type: 'item', url: '/documentos' },
            { id: 'incapacidades',  title: 'Incapacidades',      type: 'item', url: '/incapacidades' },
            { id: 'usuarios',       title: 'Usuarios',           type: 'item', url: '/usuarios' },
            { id: 'reportes',       title: 'Reportes',           type: 'item', url: '/reportes' },
            { id: 'comites',        title: 'Comités',            type: 'item', url: '/comites' },
            { id: 'backups',        title: 'Backups',            type: 'item', url: '/backups' },
          ],
        },
      ],
    },
    {
      id: 'docente',
      title: 'Docente',
      type: 'group',
      allowedRoles: [ROLES.ADMIN, ROLES.DOCENTE],
      children: [
        {
          id: 'docente-items',
          type: 'collapse',
          children: [
            { id: 'docente-estudiantes', title: 'Estudiantes',         type: 'item', url: '/docente/estudiantes' },
            { id: 'academico',           title: 'Académico',           type: 'item', url: '/docente/academico' },
            { id: 'asistencia',          title: 'Asistencia',          type: 'item', url: '/docente/asistencia' },
            { id: 'riesgo',              title: 'Riesgo académico',     type: 'item', url: '/docente/riesgo' },
            { id: 'planeamientos',       title: 'Planeamientos',       type: 'item', url: '/docente/planeamientos' },
            { id: 'comunicados',         title: 'Comunicados',         type: 'item', url: '/docente/comunicados' },
            { id: 'exportaciones',       title: 'Exportaciones',       type: 'item', url: '/docente/exportaciones' },
          ],
        },
      ],
    },
    {
      id: 'comite-group',
      title: 'Comité',
      type: 'group',
      allowedRoles: [ROLES.ADMIN, ROLES.DOCENTE, ROLES.COMITE],
      children: [
        {
          id: 'comite-items',
          type: 'collapse',
          children: [
            { id: 'crear-acta',      title: 'Actas',     type: 'item', url: '/comite/actas' },
            { id: 'agendar-reunion', title: 'Reuniones', type: 'item', url: '/comite/reuniones' },
            { id: 'roles-comite',    title: 'Roles',     type: 'item', url: '/comite/roles' },
          ],
        },
      ],
    },
    {
      id: 'auxiliares',
      title: 'Auxiliares',
      type: 'group',
      allowedRoles: [ROLES.ADMIN],
      children: [
        {
          id: 'auxiliares-items',
          type: 'collapse',
          children: [
            { id: 'informes-economicos',   title: 'Informes',      type: 'item', url: '/auxiliares/informes' },
            { id: 'reglamentos',           title: 'Reglamentos',   type: 'item', url: '/auxiliares/reglamentos' },
            { id: 'reportes-cumplimiento', title: 'Cumplimiento',  type: 'item', url: '/auxiliares/cumplimiento' },
          ],
        },
      ],
    },
    {
      id: 'estudiante',
      title: 'Estudiante',
      type: 'group',
      allowedRoles: [ROLES.ADMIN, ROLES.ESTUDIANTE],
      children: [
        {
          id: 'estudiante-items',
          type: 'collapse',
          children: [
            { id: 'estudiante-comunicados', title: 'Comunicados y horarios', type: 'item', url: '/estudiante/comunicados' },
          ],
        },
      ],
    },
  ],
};

export default menuItems;
