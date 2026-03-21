import { lazy } from 'react';
import MainLayout from '../layout/MainLayout/index';
import Loadable from '../components/ui/Loadable';
import PublicLayout from '../layout/PublicLayout/index';
import RequireAuth from './RequireAuth';
import { ROLES } from '../constants/roles';

// Public
const PublicHome  = Loadable(lazy(() => import('../pages/public/Home')));
const Login       = Loadable(lazy(() => import('../pages/public/Login')));
const Register    = Loadable(lazy(() => import('../pages/public/Register')));
const NoAutorizado = Loadable(lazy(() => import('../pages/public/NoAutorizado')));

// Transversal
const Dashboard   = Loadable(lazy(() => import('../pages/admin/Dashboard')));
const Perfil      = Loadable(lazy(() => import('../pages/profile/Perfil')));

// Admin
const Circulares        = Loadable(lazy(() => import('../pages/admin/CircularesList')));
const Horarios          = Loadable(lazy(() => import('../pages/admin/Horarios')));
const Documentos        = Loadable(lazy(() => import('../pages/admin/OficiosPlantillas')));
const Incapacidades     = Loadable(lazy(() => import('../pages/admin/Incapacidades')));
const Usuarios          = Loadable(lazy(() => import('../pages/admin/GestionPermisosModulos')));
const Reportes          = Loadable(lazy(() => import('../pages/admin/Reportes')));
const Comites           = Loadable(lazy(() => import('../pages/admin/Comites')));
const Backups           = Loadable(lazy(() => import('../pages/admin/Backups')));

// Docente
const DocenteEstudiantes = Loadable(lazy(() => import('../pages/docente/RegistroEstudiantes')));
const Academico          = Loadable(lazy(() => import('../pages/docente/Evaluaciones')));
const Asistencia         = Loadable(lazy(() => import('../pages/docente/RegistroAsistencia')));
const Riesgo             = Loadable(lazy(() => import('../pages/docente/RiesgoEstudiantes')));
const Planeamientos      = Loadable(lazy(() => import('../pages/docente/Planeamientos')));
const Comunicados        = Loadable(lazy(() => import('../pages/docente/Comunicados')));
const Exportaciones      = Loadable(lazy(() => import('../pages/docente/Exportaciones')));

// Comité
const Actas        = Loadable(lazy(() => import('../pages/comite/CrearActa')));
const Reuniones    = Loadable(lazy(() => import('../pages/comite/AgendarReunion')));
const RolesComite  = Loadable(lazy(() => import('../pages/comite/RolesComite')));

// Auxiliares
const Informes      = Loadable(lazy(() => import('../pages/auxiliares/InformesEconomicos')));
const Reglamentos   = Loadable(lazy(() => import('../pages/auxiliares/Reglamentos')));
const Cumplimiento  = Loadable(lazy(() => import('../pages/auxiliares/ReportesCumplimiento')));

// Estudiante
const EstudianteComunicados = Loadable(lazy(() => import('../pages/estudiante/Notificaciones')));

const ALL_AUTH = [ROLES.ADMIN, ROLES.DOCENTE, ROLES.ESTUDIANTE, ROLES.COMITE];

function Guard({ roles, children }) {
  return <RequireAuth allowedRoles={roles}>{children}</RequireAuth>;
}

const PublicRoutes = {
  path: '/',
  element: <PublicLayout />,
  children: [
    { index: true, element: <PublicHome /> },
    { path: 'login',    element: <Login /> },
    { path: 'register', element: <Register /> },
    { path: 'no-autorizado', element: <NoAutorizado /> },
  ],
};

const AppRoutes = {
  path: '/',
  element: (
    <Guard roles={ALL_AUTH}>
      <MainLayout />
    </Guard>
  ),
  children: [
    // Transversal
    { path: 'dashboard', element: <Guard roles={ALL_AUTH}><Dashboard /></Guard> },
    { path: 'perfil',    element: <Guard roles={ALL_AUTH}><Perfil /></Guard> },

    // Admin
    { path: 'circulares',    element: <Guard roles={[ROLES.ADMIN]}><Circulares /></Guard> },
    { path: 'horarios',      element: <Guard roles={[ROLES.ADMIN, ROLES.DOCENTE]}><Horarios /></Guard> },
    { path: 'documentos',    element: <Guard roles={[ROLES.ADMIN, ROLES.DOCENTE, ROLES.COMITE]}><Documentos /></Guard> },
    { path: 'incapacidades', element: <Guard roles={[ROLES.ADMIN]}><Incapacidades /></Guard> },
    { path: 'usuarios',      element: <Guard roles={[ROLES.ADMIN]}><Usuarios /></Guard> },
    { path: 'reportes',      element: <Guard roles={[ROLES.ADMIN]}><Reportes /></Guard> },
    { path: 'comites',       element: <Guard roles={[ROLES.ADMIN]}><Comites /></Guard> },
    { path: 'backups',       element: <Guard roles={[ROLES.ADMIN]}><Backups /></Guard> },

    // Docente
    {
      path: 'docente',
      children: [
        { path: 'estudiantes',  element: <Guard roles={[ROLES.ADMIN, ROLES.DOCENTE]}><DocenteEstudiantes /></Guard> },
        { path: 'academico',    element: <Guard roles={[ROLES.ADMIN, ROLES.DOCENTE]}><Academico /></Guard> },
        { path: 'asistencia',   element: <Guard roles={[ROLES.ADMIN, ROLES.DOCENTE]}><Asistencia /></Guard> },
        { path: 'riesgo',       element: <Guard roles={[ROLES.ADMIN, ROLES.DOCENTE]}><Riesgo /></Guard> },
        { path: 'planeamientos',element: <Guard roles={[ROLES.ADMIN, ROLES.DOCENTE]}><Planeamientos /></Guard> },
        { path: 'comunicados',  element: <Guard roles={[ROLES.ADMIN, ROLES.DOCENTE]}><Comunicados /></Guard> },
        { path: 'exportaciones',element: <Guard roles={[ROLES.ADMIN, ROLES.DOCENTE]}><Exportaciones /></Guard> },
      ],
    },

    // Comité
    {
      path: 'comite',
      children: [
        { path: 'actas',    element: <Guard roles={[ROLES.ADMIN, ROLES.COMITE]}><Actas /></Guard> },
        { path: 'reuniones',element: <Guard roles={[ROLES.ADMIN, ROLES.COMITE]}><Reuniones /></Guard> },
        { path: 'roles',    element: <Guard roles={[ROLES.ADMIN, ROLES.COMITE]}><RolesComite /></Guard> },
      ],
    },

    // Auxiliares
    {
      path: 'auxiliares',
      children: [
        { path: 'informes',     element: <Guard roles={[ROLES.ADMIN]}><Informes /></Guard> },
        { path: 'reglamentos',  element: <Guard roles={[ROLES.ADMIN]}><Reglamentos /></Guard> },
        { path: 'cumplimiento', element: <Guard roles={[ROLES.ADMIN]}><Cumplimiento /></Guard> },
      ],
    },

    // Estudiante
    {
      path: 'estudiante',
      children: [
        { path: 'comunicados', element: <Guard roles={[ROLES.ADMIN, ROLES.ESTUDIANTE]}><EstudianteComunicados /></Guard> },
      ],
    },
  ],
};

export default [PublicRoutes, AppRoutes];
