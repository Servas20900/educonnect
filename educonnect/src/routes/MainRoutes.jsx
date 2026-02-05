import { lazy } from 'react';

// project imports
import MainLayout from '../layout/MainLayout/index';
import Loadable from '../components/ui/Loadable';
import PublicLayout from '../layout/PublicLayout/index';
import RequireAuth from './RequireAuth';
import { ROLES } from '../constants/roles';
const PublicHome = Loadable(lazy(() => import('../pages/public/Home')));
const Login = Loadable(lazy(() => import('../pages/public/Login')));
const Register = Loadable(lazy(() => import('../pages/public/Register')));


// pages routing
const Dashboard = Loadable(lazy(() => import('../pages/admin/Dashboard')));
const CircularesList = Loadable(lazy(() => import('../pages/admin/CircularesList')));
// CircularesEdit removed
const Horarios = Loadable(lazy(() => import('../pages/admin/Horarios')));
const Reportes = Loadable(lazy(() => import('../pages/admin/Reportes')));
const GestionPermisosModulos = Loadable(lazy(() => import('../pages/admin/GestionPermisosModulos')));
const Incapacidades = Loadable(lazy(() => import('../pages/admin/Incapacidades')));
const Comites = Loadable(lazy(() => import('../pages/admin/Comites')));
const AprobacionesHorarios = Loadable(lazy(() => import('../pages/admin/AprobacionesHorarios')));
const OficiosPlantillas = Loadable(lazy(() => import('../pages/admin/OficiosPlantillas')));
const Repositorios = Loadable(lazy(() => import('../pages/admin/Repositorios')));
const Backups = Loadable(lazy(() => import('../pages/admin/Backups')));
const Retencion = Loadable(lazy(() => import('../pages/admin/Retencion')));

const DocenteDashboard = Loadable(lazy(() => import('../pages/docente/DocenteDashboard')));
const Evaluaciones = Loadable(lazy(() => import('../pages/docente/Evaluaciones')));
const Asistencia = Loadable(lazy(() => import('../pages/docente/RegistroAsistencia')));
const RegistroEstudiantes = Loadable(lazy(() => import('../pages/docente/RegistroEstudiantes')));
const Calificaciones = Loadable(lazy(() => import('../pages/docente/Calificaciones')));
const Promedios = Loadable(lazy(() => import('../pages/docente/Promedios')));
const Planeamientos = Loadable(lazy(() => import('../pages/docente/Planeamientos')));
const Comunicados = Loadable(lazy(() => import('../pages/docente/Comunicados')));
const Exportaciones = Loadable(lazy(() => import('../pages/docente/Exportaciones')));
const RiesgoEstudiantes = Loadable(lazy(() => import('../pages/docente/RiesgoEstudiantes')));

const HomeEstudiante = Loadable(lazy(() => import('../pages/estudiante/Home')));
const Notificaciones = Loadable(lazy(() => import('../pages/estudiante/Notificaciones')));
const CircularesYHorarios = Loadable(lazy(() => import('../pages/estudiante/CircularesYHorarios')));

const HomeComite = Loadable(lazy(() => import('../pages/comite/Home')));
const CrearActa = Loadable(lazy(() => import('../pages/comite/CrearActa')));
const AgendarReunion = Loadable(lazy(() => import('../pages/comite/AgendarReunion')));
const RolesComite = Loadable(lazy(() => import('../pages/comite/RolesComite')));

const InformesEconomicos = Loadable(lazy(() => import('../pages/auxiliares/InformesEconomicos')));
const Reglamentos = Loadable(lazy(() => import('../pages/auxiliares/Reglamentos')));
const InformesPAT = Loadable(lazy(() => import('../pages/auxiliares/InformesPAT')));
const ReportesCumplimiento = Loadable(lazy(() => import('../pages/auxiliares/ReportesCumplimiento')));

const Perfil = Loadable(lazy(() => import('../pages/profile/Perfil')));
const Configuracion = Loadable(lazy(() => import('../pages/profile/Configuracion')));



// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <PublicLayout />,
  children: [
    {
      index: true,
      element: <PublicHome />
    },
    {
      path: 'login',
      element: <Login />
    },
    {
      path: 'register',
      element: <Register />
    },
  ]
};

const AppRoutes = {
  path: '/',
  element: (
    <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.DOCENTE, ROLES.ESTUDIANTE]}>
      <MainLayout />
    </RequireAuth>
  ),
  children: [
    {
      path: 'dashboard',
      element: (
        <RequireAuth allowedRoles={[ROLES.ADMIN]}>
          <Dashboard />
        </RequireAuth>
      )
    },
    {
      path: 'circulares',
      element: (
        <RequireAuth allowedRoles={[ROLES.ADMIN]}>
          <CircularesList />
        </RequireAuth>
      )
    },
    {
      path: 'horarios',
      element: (
        <RequireAuth allowedRoles={[ROLES.ADMIN]}>
          <Horarios />
        </RequireAuth>
      )
    },
    {
      path: 'horarios/aprobaciones',
      element: (
        <RequireAuth allowedRoles={[ROLES.ADMIN]}>
          <AprobacionesHorarios />
        </RequireAuth>
      )
    },
    {
      path: 'reportes',
      element: (
        <RequireAuth allowedRoles={[ROLES.ADMIN]}>
          <Reportes />
        </RequireAuth>
      )
    },
    {
      path: 'permisos',
      element: (
        <RequireAuth allowedRoles={[ROLES.ADMIN]}>
          <GestionPermisosModulos />
        </RequireAuth>
      )
    },
    {
      path: 'incapacidades',
      element: (
        <RequireAuth allowedRoles={[ROLES.ADMIN]}>
          <Incapacidades />
        </RequireAuth>
      )
    },
    {
      path: 'comites',
      element: (
        <RequireAuth allowedRoles={[ROLES.ADMIN]}>
          <Comites />
        </RequireAuth>
      )
    },
    {
      path: 'oficios',
      element: (
        <RequireAuth allowedRoles={[ROLES.ADMIN]}>
          <OficiosPlantillas />
        </RequireAuth>
      )
    },
    {
      path: 'repositorios',
      element: (
        <RequireAuth allowedRoles={[ROLES.ADMIN]}>
          <Repositorios />
        </RequireAuth>
      )
    },
    {
      path: 'backups',
      element: (
        <RequireAuth allowedRoles={[ROLES.ADMIN]}>
          <Backups />
        </RequireAuth>
      )
    },
    {
      path: 'retencion',
      element: (
        <RequireAuth allowedRoles={[ROLES.ADMIN]}>
          <Retencion />
        </RequireAuth>
      )
    },

    {
      path: 'docente',
      children: [
        {
          path: 'dashboard',
          element: (
            <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.DOCENTE]}>
              <DocenteDashboard />
            </RequireAuth>
          )
        },
        {
          path: 'estudiantes',
          element: (
            <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.DOCENTE]}>
              <RegistroEstudiantes />
            </RequireAuth>
          )
        },
        {
          path: 'evaluaciones',
          element: (
            <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.DOCENTE]}>
              <Evaluaciones />
            </RequireAuth>
          )
        },
        {
          path: 'calificaciones',
          element: (
            <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.DOCENTE]}>
              <Calificaciones />
            </RequireAuth>
          )
        },
        {
          path: 'promedios',
          element: (
            <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.DOCENTE]}>
              <Promedios />
            </RequireAuth>
          )
        },
        {
          path: 'planeamientos',
          element: (
            <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.DOCENTE]}>
              <Planeamientos />
            </RequireAuth>
          )
        },
        {
          path: 'comunicados',
          element: (
            <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.DOCENTE]}>
              <Comunicados />
            </RequireAuth>
          )
        },
        {
          path: 'asistencia',
          element: (
            <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.DOCENTE]}>
              <Asistencia />
            </RequireAuth>
          )
        },
        {
          path: 'exportaciones',
          element: (
            <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.DOCENTE]}>
              <Exportaciones />
            </RequireAuth>
          )
        },
        {
          path: 'riesgo',
          element: (
            <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.DOCENTE]}>
              <RiesgoEstudiantes />
            </RequireAuth>
          )
        }
      ]
    },
    {
      path: 'comite',
      children: [
        {
          path: 'home',
          element: (
            <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.DOCENTE]}>
              <HomeComite />
            </RequireAuth>
          )
        },
        {
          path: 'crear-acta',
          element: (
            <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.DOCENTE]}>
              <CrearActa />
            </RequireAuth>
          )
        },
        {
          path: 'reunion',
          element: (
            <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.DOCENTE]}>
              <AgendarReunion />
            </RequireAuth>
          )
        },
        {
          path: 'roles',
          element: (
            <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.DOCENTE]}>
              <RolesComite />
            </RequireAuth>
          )
        }
      ]
    },
    {
      path: 'auxiliares',
      children: [
        {
          path: 'informes-economicos',
          element: (
            <RequireAuth allowedRoles={[ROLES.ADMIN]}>
              <InformesEconomicos />
            </RequireAuth>
          )
        },
        {
          path: 'reglamentos',
          element: (
            <RequireAuth allowedRoles={[ROLES.ADMIN]}>
              <Reglamentos />
            </RequireAuth>
          )
        },
        {
          path: 'informes-pat',
          element: (
            <RequireAuth allowedRoles={[ROLES.ADMIN]}>
              <InformesPAT />
            </RequireAuth>
          )
        },
        {
          path: 'reportes-cumplimiento',
          element: (
            <RequireAuth allowedRoles={[ROLES.ADMIN]}>
              <ReportesCumplimiento />
            </RequireAuth>
          )
        }
      ]
    },
    {
      path: 'estudiante',
      children: [
        {
          path: 'home',
          element: (
            <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.ESTUDIANTE]}>
              <HomeEstudiante />
            </RequireAuth>
          )
        },
        {
          path: 'notificaciones',
          element: (
            <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.ESTUDIANTE]}>
              <Notificaciones />
            </RequireAuth>
          )
        },
        {
          path: 'circulares_horarios',
          element: (
            <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.ESTUDIANTE]}>
              <CircularesYHorarios />
            </RequireAuth>
          )
        }
      ]
    },
    {
      path: 'perfil',
      element: (
        <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.DOCENTE, ROLES.ESTUDIANTE]}>
          <Perfil />
        </RequireAuth>
      )
    },
    {
      path: 'configuracion',
      element: (
        <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.DOCENTE, ROLES.ESTUDIANTE]}>
          <Configuracion />
        </RequireAuth>
      )
    }
  ]
};

export default [MainRoutes, AppRoutes];
