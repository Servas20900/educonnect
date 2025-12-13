import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';

import useAuth from '../hooks/useAuth';

export default function RequireAuth({ children, allowedRoles }) {
  const { role } = useAuth();
  const location = useLocation();

  if (!role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

RequireAuth.propTypes = {
  children: PropTypes.node,
  allowedRoles: PropTypes.arrayOf(PropTypes.string)
};
