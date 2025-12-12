// Menu structured by modules: each top-level item is a group (module)
// with a single collapse that contains the module's pages as items.
const menuItems = {
  items: [
    {
      id: 'admin',
      title: 'Admin',
      type: 'group',
      children: [
        {
          id: 'admin-collapse',
          title: 'Administración',
          type: 'collapse',
          children: [
            { id: 'dashboard', title: 'Dashboard', type: 'item', url: '/dashboard' },
            { id: 'circulares', title: 'Circulares', type: 'item', url: '/circulares' },
            { id: 'circulares-edit', title: 'Editar Circular', type: 'item', url: '/circulares/edit' },
            { id: 'horarios', title: 'Horarios', type: 'item', url: '/horarios' },
            { id: 'reportes', title: 'Reportes', type: 'item', url: '/reportes' },
            { id: 'usuarios', title: 'Usuarios', type: 'item', url: '/usuarios' },
            { id: 'permisos', title: 'Permisos', type: 'item', url: '/permisos' },
            { id: 'incapacidades', title: 'Incapacidades', type: 'item', url: '/incapacidades'},
            { id: 'comite', title: 'Comites', type: 'item', url: '/comites'},
            { id: 'seguridad', title: 'Seguridad', type: 'item', url: '/seguridad'}
          ]
        }
      ]
    },
    {
      id: 'docente',
      title: 'Docente',
      type: 'group',
      children: [
        {
          id: 'docente-collapse',
          title: 'Docente',
          type: 'collapse',
          children: [
            { id: 'docente-dashboard', title: 'Dashboard', type: 'item', url: '/docente/dashboard' },
            { id: 'evaluaciones', title: 'Evaluaciones', type: 'item', url: '/docente/evaluaciones' },
            { id: 'asistencia', title: 'Asistencia', type: 'item', url: '/docente/asistencia' }
          ]
        }
      ]
    },
    {
      id: 'estudiante',
      title: 'Estudiante',
      type: 'group',
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
    },
    {
      id: 'comites',
      title: 'Comites',
      type: 'group',
      children: [
        {
          id: 'comites-collapse',
          title: 'Comites',
          type: 'collapse',
          children: [
            { id: 'comite-home', title: 'Home', type: 'item', url: '/comite/home' },
            { id: 'crear-acta', title: 'Crear Actas', type: 'item', url: '/comite/crear-acta' },
            { id: 'agendar-reunion', title: 'Agendar Reunion', type: 'item', url: '/comite/reunion' }
          ]
        }
      ]
    }
  ]
};

export default menuItems;
