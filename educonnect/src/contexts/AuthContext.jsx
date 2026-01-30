import PropTypes from 'prop-types';
import { createContext, useMemo, useState, useEffect, useCallback } from 'react';
import { getSessionStatus, logoutUsuario } from '../api/authService';

const initialAuthState = { role: null, isLoading: true, username: null };

export const AuthContext = createContext({
  role: null,
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
      // Verificar si hay token en localStorage
      const token = localStorage.getItem('access_token');
      if (!token) {
        setAuthState({ role: null, username: null, isLoading: false });
        return;
      }

      const response = await getSessionStatus();
      if (response.isAuthenticated) {
        setAuthState({ 
          role: response.role, 
          username: response.user,
          isLoading: false 
        });
      } else {
        setAuthState({ role: null, username: null, isLoading: false });
      }
    } catch (error) {
      setAuthState({ role: null, username: null, isLoading: false });
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
        username: null, 
        isLoading: false 
      });
    } else {
      setAuthState({ 
        role: authData.role, 
        username: authData.user,
        isLoading: false 
      });
    }
    console.log("AuthContext actualizado con rol:", authData.role || authData);
  }, []);

  const logout = useCallback(async () => {
    await logoutUsuario();
    setAuthState({ role: null, username: null, isLoading: false });
  }, []);

  const value = useMemo(
    () => ({
      role: authState.role,
      username: authState.username,
      isLoading: authState.isLoading,
      login,
      logout,
      checkAuth
    }),
    [authState, login, logout, checkAuth]
  );

  // Solo mostrar children cuando no está cargando al inicio
  // Pero permitir que se navegue durante el login
  if (authState.isLoading && !localStorage.getItem('access_token')) {
    return null;
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