import PropTypes from 'prop-types';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { fetchSystemBootstrap } from '../api/systemConfigService';
import useAuth from '../hooks/useAuth';

const initialState = {
  bootstrap: null,
  loading: false,
  error: null,
};

export const SystemConfigContext = createContext({
  ...initialState,
  refreshBootstrap: async () => {},
  canAccess: () => true,
  getCatalog: () => [],
  getNavigationForRole: () => [],
  getPublicNav: () => [],
  branding: {},
});

export function SystemConfigProvider({ children }) {
  const { role } = useAuth();
  const [state, setState] = useState(initialState);

  const refreshBootstrap = useCallback(async () => {
    if (!role) {
      setState(initialState);
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchSystemBootstrap();
      setState({ bootstrap: data, loading: false, error: null });
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error }));
    }
  }, [role]);

  useEffect(() => {
    refreshBootstrap();
  }, [refreshBootstrap]);

  const canAccess = useCallback(
    (permissionKey) => {
      if (!permissionKey) return true;
      const allowed = state.bootstrap?.route_permissions?.[permissionKey] || [];
      if (allowed.length === 0) return true;
      return allowed.includes(role);
    },
    [role, state.bootstrap]
  );

  const getCatalog = useCallback(
    (catalogKey, fallback = []) => state.bootstrap?.catalogs?.[catalogKey] || fallback,
    [state.bootstrap]
  );

  const getNavigationForRole = useCallback(
    (currentRole) => {
      const groups = state.bootstrap?.navigation?.items || [];
      if (!currentRole) return [];
      return groups.filter((group) => {
        const allowedRoles = group.allowed_roles || [];
        return allowedRoles.length === 0 || allowedRoles.includes(currentRole);
      });
    },
    [state.bootstrap]
  );

  const getPublicNav = useCallback(
    () => state.bootstrap?.public_nav || [
      { to: '/', label: 'Inicio' },
      { to: '/login', label: 'Iniciar sesion' },
      { to: '/register', label: 'Registrarse' },
    ],
    [state.bootstrap]
  );

  const value = useMemo(
    () => ({
      ...state,
      refreshBootstrap,
      canAccess,
      getCatalog,
      getNavigationForRole,
      getPublicNav,
      branding: state.bootstrap?.branding || {},
    }),
    [state, refreshBootstrap, canAccess, getCatalog, getNavigationForRole, getPublicNav]
  );

  return (
    <SystemConfigContext.Provider value={value}>
      {children}
    </SystemConfigContext.Provider>
  );
}

SystemConfigProvider.propTypes = {
  children: PropTypes.node,
};
