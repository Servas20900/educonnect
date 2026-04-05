import { lazy } from 'react';
import MainLayout from '../layout/MainLayout/index';
import Loadable from '../components/ui/Loadable';
import PublicLayout from '../layout/PublicLayout/index';
import RequireAuth from './RequireAuth';

// Public
const PublicHome  = Loadable(lazy(() => import('../pages/public/Home')));
const Login       = Loadable(lazy(() => import('../pages/public/Login')));
const Register    = Loadable(lazy(() => import('../pages/public/Register')));
const NoAutorizado = Loadable(lazy(() => import('../pages/public/NoAutorizado')));

// Transversal
const Dashboard   = Loadable(lazy(() => import('../pages/admin/Dashboard')));
const Perfil      = Loadable(lazy(() => import('../pages/profile/Perfil')));

// Admin
const Circulares        = Loadable(lazy(() => import('../pages/admin/Circulares')));
const CircularesArchivadas = Loadable(lazy(() => import('../pages/admin/Circulares/Archivadas')));
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
const CircularesDocente  = Loadable(lazy(() => import('../pages/docente/CircularesDocente')));
const Exportaciones      = Loadable(lazy(() => import('../pages/docente/Exportaciones')));

// Comité
const Actas        = Loadable(lazy(() => import('../pages/comite/CrearActa')));
const Reuniones    = Loadable(lazy(() => import('../pages/comite/AgendarReunion')));
const RolesComite  = Loadable(lazy(() => import('../pages/comite/RolesComite')));

// Auxiliares
const Informes      = Loadable(lazy(() => import('../pages/auxiliares/informesEconomicos')));
const Reglamentos   = Loadable(lazy(() => import('../pages/auxiliares/Reglamentos')));
const Cumplimiento  = Loadable(lazy(() => import('../pages/auxiliares/ReportesCumplimiento')));

// Estudiante
const EstudianteComunicados = Loadable(lazy(() => import('../pages/estudiante/Notificaciones')));

function Guard({ permissionKey, children }) {
  return <RequireAuth permissionKey={permissionKey}>{children}</RequireAuth>;
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
    <Guard>
      <MainLayout />
    </Guard>
  ),
  children: [
    // Transversal
    { path: 'dashboard', element: <Guard permissionKey="dashboard"><Dashboard /></Guard> },
    { path: 'perfil',    element: <Guard permissionKey="perfil"><Perfil /></Guard> },

    // Admin
    { path: 'circulares',    element: <Guard permissionKey="circulares"><Circulares /></Guard> },
    { path: 'circulares-archivadas', element: <Guard permissionKey="circulares-archivadas"><CircularesArchivadas /></Guard> },
    { path: 'horarios',      element: <Guard permissionKey="horarios"><Horarios /></Guard> },
    { path: 'documentos',    element: <Guard permissionKey="documentos"><Documentos /></Guard> },
    { path: 'incapacidades', element: <Guard permissionKey="incapacidades"><Incapacidades /></Guard> },
    { path: 'usuarios',      element: <Guard permissionKey="usuarios"><Usuarios /></Guard> },
    { path: 'reportes',      element: <Guard permissionKey="reportes"><Reportes /></Guard> },
    { path: 'comites',       element: <Guard permissionKey="comites"><Comites /></Guard> },
    { path: 'backups',       element: <Guard permissionKey="backups"><Backups /></Guard> },

    // Docente
    {
      path: 'docente',
      children: [
        { path: 'estudiantes',  element: <Guard permissionKey="docente-estudiantes"><DocenteEstudiantes /></Guard> },
        { path: 'academico',    element: <Guard permissionKey="academico"><Academico /></Guard> },
        { path: 'asistencia',   element: <Guard permissionKey="asistencia"><Asistencia /></Guard> },
        { path: 'riesgo',       element: <Guard permissionKey="riesgo"><Riesgo /></Guard> },
        { path: 'planeamientos',element: <Guard permissionKey="planeamientos"><Planeamientos /></Guard> },
        { path: 'comunicados',  element: <Guard permissionKey="comunicados"><Comunicados /></Guard> },
        { path: 'circulares',   element: <Guard permissionKey="docente-circulares"><CircularesDocente /></Guard> },
        { path: 'exportaciones',element: <Guard permissionKey="exportaciones"><Exportaciones /></Guard> },
      ],
    },

    // Comité
    {
      path: 'comite',
      children: [
        { path: 'actas',    element: <Guard permissionKey="comite-actas"><Actas /></Guard> },
        { path: 'reuniones',element: <Guard permissionKey="comite-reuniones"><Reuniones /></Guard> },
        { path: 'roles',    element: <Guard permissionKey="comite-roles"><RolesComite /></Guard> },
      ],
    },

    // Auxiliares
    {
      path: 'auxiliares',
      children: [
        { path: 'informes',     element: <Guard permissionKey="auxiliares-informes"><Informes /></Guard> },
        { path: 'reglamentos',  element: <Guard permissionKey="auxiliares-reglamentos"><Reglamentos /></Guard> },
        { path: 'cumplimiento', element: <Guard permissionKey="auxiliares-cumplimiento"><Cumplimiento /></Guard> },
      ],
    },

    // Estudiante
    {
      path: 'estudiante',
      children: [
        { path: 'comunicados', element: <Guard permissionKey="estudiante-comunicados"><EstudianteComunicados /></Guard> },
      ],
    },
  ],
};

export default [PublicRoutes, AppRoutes];
