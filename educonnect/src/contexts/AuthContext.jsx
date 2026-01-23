import PropTypes from 'prop-types';
import { createContext, useMemo, useState, useEffect, useCallback } from 'react';
import { getSessionStatus } from '../api/authService';
import { ROLES } from '../constants/roles';

const initialAuthState = { role: null, isLoading: true };

export const AuthContext = createContext({
  role: null,
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
        setAuthState({ role: response.role, isLoading: false });
      } else {
        setAuthState({ role: null, isLoading: false });
      }
    } catch (error) {
      setAuthState({ role: null, isLoading: false });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = (authData) => {
    setAuthState({ role: authData, isLoading: false });
  };

  const logout = () => setAuthState({ role: null, isLoading: false });

  const value = useMemo(
    () => ({
      role: authState.role,
      isLoading: authState.isLoading,
      login,
      logout,
      checkAuth
    }),
    [authState, checkAuth]
  );

  return (
    <AuthContext.Provider value={value}>
      {!authState.isLoading && children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node
};

export { ROLES };