import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';

import useAuth from '../hooks/useAuth';

export default function RequireAuth({ children, allowedRoles }) {
  const { role: authData } = useAuth();
  const location = useLocation();

  const currentRole = authData?.role;

  if (!currentRole) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(currentRole)) {
    console.warn(`Acceso denegado. Rol actual: ${currentRole}. Esperados:`, allowedRoles);
    return <Navigate to="/login" replace />;
  }

  return children;
}

RequireAuth.propTypes = {
  children: PropTypes.node,
  allowedRoles: PropTypes.arrayOf(PropTypes.string)
};
