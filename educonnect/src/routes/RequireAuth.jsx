import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';

import useAuth from '../hooks/useAuth';
import Loader from '../components/ui/Loader';

export default function RequireAuth({ children, allowedRoles }) {
  const { role, isLoading } = useAuth();
  const location = useLocation();

  // Si aún está cargando, mostrar loader
  if (isLoading) {
    return <Loader />;
  }

  // Si no hay rol, redirigir a login
  if (!role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si hay roles permitidos y el actual no está incluido
  if (allowedRoles?.length && !allowedRoles.includes(role)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return children;
}

RequireAuth.propTypes = {
  children: PropTypes.node,
  allowedRoles: PropTypes.arrayOf(PropTypes.string)
};
