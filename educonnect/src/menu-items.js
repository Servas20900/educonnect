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
            { id: 'usuarios', title: 'Usuarios', type: 'item', url: '/usuarios' }
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
            { id: 'evaluaciones', title: 'Evaluaciones', type: 'item', url: '/docente/evaluaciones' }
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
            { id: 'estudiante-horario', title: 'Horario Consulta', type: 'item', url: '/estudiante/horario-consulta' }
          ]
        }
      ]
    }
  ]
};

export default menuItems;
