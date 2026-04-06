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
  const { role, roles } = useAuth();
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
      const roleList = Array.isArray(roles) && roles.length > 0 ? roles : (role ? [role] : []);
      return allowed.some((allowedRole) => roleList.includes(allowedRole));
    },
    [role, roles, state.bootstrap]
  );

  const getCatalog = useCallback(
    (catalogKey, fallback = []) => state.bootstrap?.catalogs?.[catalogKey] || fallback,
    [state.bootstrap]
  );

  const getNavigationForRole = useCallback(
    (currentRole) => {
      const groups = state.bootstrap?.navigation?.items || [];
      const roleList = Array.isArray(currentRole)
        ? currentRole
        : (currentRole ? [currentRole] : []);
      if (roleList.length === 0) return [];
      const filteredGroups = groups.filter((group) => {
        const allowedRoles = group.allowed_roles || [];
        return allowedRoles.length === 0 || allowedRoles.some((allowedRole) => roleList.includes(allowedRole));
      });

      // Fallback defensivo: asegura items clave de docente aunque la configuracion
      // en DB aun no haya sido actualizada.
      return filteredGroups.map((group) => {
        if (group.id !== 'docente') return group;

        const children = Array.isArray(group.children) ? group.children : [];
        if (children.length === 0) return group;

        const docenteSection = children[0];
        const docenteItems = Array.isArray(docenteSection.children)
          ? docenteSection.children
          : [];

        const existsHorario = docenteItems.some((item) => item.id === 'docente-horario');
        const existsDocumentos = docenteItems.some((item) => item.id === 'documentos');

        if (existsHorario && existsDocumentos) return group;

        const fallbackItems = [];
        if (!existsDocumentos) {
          fallbackItems.push({
            id: 'documentos',
            title: 'Documentos',
            type: 'item',
            url: '/documentos',
          });
        }

        if (!existsHorario) {
          fallbackItems.push({
            id: 'docente-horario',
            title: 'Horario',
            type: 'item',
            url: '/docente/horario',
          });
        }

        const cleanedItems = docenteItems.filter(
          (item) => item.id !== 'academico'
            && item.id !== 'asistencia'
            && item.id !== 'riesgo'
            && item.id !== 'incapacidades'
            && item.id !== 'docente-incapacidades'
            && item.id !== 'exportaciones'
        );

        return {
          ...group,
          children: [
            {
              ...docenteSection,
              children: [
                ...cleanedItems,
                ...fallbackItems,
              ],
            },
            ...children.slice(1),
          ],
        };
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
