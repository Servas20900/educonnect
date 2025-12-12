import { lazy } from 'react';

// project imports
import MainLayout from '../layout/MainLayout/index';
import Loadable from '../components/ui/Loadable';


// pages routing
const Dashboard = Loadable(lazy(() => import('../pages/admin/Dashboard')));
const CircularesList = Loadable(lazy(() => import('../pages/admin/CircularesList')));
const CircularesEdit = Loadable(lazy(() => import('../pages/admin/CircularesEdit')));
const Horarios = Loadable(lazy(() => import('../pages/admin/Horarios')));
const Reportes = Loadable(lazy(() => import('../pages/admin/Reportes')));
const Usuarios = Loadable(lazy(() => import('../pages/admin/Usuarios')));
const Permisos = Loadable(lazy(() => import('../pages/admin/Permisos')));
const Incapacidades = Loadable(lazy(() => import('../pages/admin/Incapacidades')));
const Comites = Loadable(lazy(() => import('../pages/admin/Comites')));
const Seguridad = Loadable(lazy(() => import('../pages/admin/Seguridad')));

const DocenteDashboard = Loadable(lazy(() => import('../pages/docente/DocenteDashboard')));
const Evaluaciones = Loadable(lazy(() => import('../pages/docente/Evaluaciones')));
const Asistencia = Loadable(lazy(() => import('../pages/docente/RegistroAsistencia')));

const HomeEstudiante = Loadable(lazy(() => import('../pages/estudiante/Home')));
const Notificaciones = Loadable(lazy(() => import('../pages/estudiante/Notificaciones')));
const CircularesYHorarios = Loadable(lazy(() => import('../pages/estudiante/CircularesYHorarios')));

const HomeComite = Loadable(lazy(() => import('../pages/comite/Home')));
const CrearActa = Loadable(lazy(() => import('../pages/comite/CrearActa')));
const AgendarReunion = Loadable(lazy(() => import('../pages/comite/AgendarReunion')));



// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <MainLayout />,
  children: [
    {
      index: true,
      element: <Dashboard />
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <Dashboard />
        }
      ]
    },
    {
      path: 'circulares',
      element: <CircularesList />
    },
    {
      path: 'circulares/edit',
      element: <CircularesEdit />
    },
    {
      path: 'horarios',
      element: <Horarios />
    },
    {
      path: 'reportes',
      element: <Reportes />
    },
    {
      path: 'usuarios',
      element: <Usuarios />
    },
    {
      path: 'permisos',
      element: <Permisos />
    },
    {
      path: 'incapacidades',
      element: <Incapacidades />
    },
    {
      path: 'comites',
      element: <Comites />
    },
    {
      path: 'seguridad',
      element: <Seguridad />
    },
    {
      path: 'docente',
      children: [
        {
          path: 'dashboard',
          element: <DocenteDashboard />
        },
        {
          path: 'evaluaciones',
          element: <Evaluaciones />
        },
        {
          path: 'asistencia',
          element: <Asistencia/>
        }
      ]
    },
    {
      path: 'estudiante',
      children: [
        {
          path: 'home',
          element: <HomeEstudiante />
        },
        {
          path: 'notificaciones',
          element: <Notificaciones />
        },
        {
          path: 'circulares_horarios',
          element: <CircularesYHorarios />
        }
      ]
    },
    {
      path: 'comite',
      children: [
        {
          path: 'home',
          element: <HomeComite />
        },
        {
          path: 'crear-acta',
          element: <CrearActa />
        },
        {
          path: 'reunion',
          element: <AgendarReunion />
        }
      ]
    }
  ]
};

export default MainRoutes;
