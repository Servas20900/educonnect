import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';

import useAuth from '../hooks/useAuth';
import useSystemConfig from '../hooks/useSystemConfig';
import Loader from '../components/ui/Loader';

export default function RequireAuth({ children, permissionKey }) {
  const { role, isLoading } = useAuth();
  const { canAccess } = useSystemConfig();
  const location = useLocation();

  // Si aún está cargando, mostrar loader
  if (isLoading) {
    return <Loader />;
  }

  // Si no hay rol, redirigir a login
  if (!role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si la matriz de permisos no autoriza esta ruta para el rol actual
  if (!canAccess(permissionKey)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return children;
}

RequireAuth.propTypes = {
  children: PropTypes.node,
  permissionKey: PropTypes.string
};
