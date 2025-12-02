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

const DocenteDashboard = Loadable(lazy(() => import('../pages/docente/DocenteDashboard')));
const Evaluaciones = Loadable(lazy(() => import('../pages/docente/Evaluaciones')));

const HomeEstudiante = Loadable(lazy(() => import('../pages/estudiante/Home')));
const HorarioConsulta = Loadable(lazy(() => import('../pages/estudiante/HorarioConsulta')));


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
      path: 'docente',
      children: [
        {
          path: 'dashboard',
          element: <DocenteDashboard />
        },
        {
          path: 'evaluaciones',
          element: <Evaluaciones />
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
          path: 'horario-consulta',
          element: <HorarioConsulta />
        }
      ]
    }
  ]
};

export default MainRoutes;
