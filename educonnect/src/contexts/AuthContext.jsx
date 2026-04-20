import PropTypes from 'prop-types';
import { createContext, useMemo, useState, useEffect, useCallback } from 'react';
import { getSessionStatus, logoutUsuario } from '../api/authService';
import Loader from '../components/ui/Loader';

const initialAuthState = { role: null, roles: [], isLoading: true, username: null };

const normalizeRoles = (inputRoles, inputRole) => {
  const roleList = Array.isArray(inputRoles)
    ? inputRoles.filter(Boolean)
    : (inputRole ? [inputRole] : []);
  const primaryRole = inputRole || roleList[0] || null;
  return { roleList, primaryRole };
};

export const AuthContext = createContext({
  role: null,
  roles: [],
  username: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  checkAuth: () => {}
});

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(initialAuthState);

  const checkAuth = useCallback(async () => {
    try {
      const response = await getSessionStatus();
      if (response.isAuthenticated) {
        const { roleList, primaryRole } = normalizeRoles(response.roles, response.role);
        setAuthState({ 
          role: primaryRole,
          roles: roleList,
          username: response.user,
          isLoading: false 
        });
      } else {
        setAuthState({ role: null, roles: [], username: null, isLoading: false });
      }
    } catch (error) {
      setAuthState({ role: null, roles: [], username: null, isLoading: false });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback((authData) => {
    // authData puede ser un objeto con role y user, o solo el role string
    if (typeof authData === 'string') {
      setAuthState({ 
        role: authData, 
        roles: [authData],
        username: null, 
        isLoading: false 
      });
    } else {
      const { roleList, primaryRole } = normalizeRoles(authData.roles, authData.role);
      setAuthState({ 
        role: primaryRole,
        roles: roleList,
        username: authData.user,
        isLoading: false 
      });
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutUsuario();
    setAuthState({ role: null, roles: [], username: null, isLoading: false });
  }, []);

  const value = useMemo(
    () => ({
      role: authState.role,
      roles: authState.roles,
      username: authState.username,
      isLoading: authState.isLoading,
      login,
      logout,
      checkAuth
    }),
    [authState, login, logout, checkAuth]
  );

  if (authState.isLoading) {
    return <Loader />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node
};