import PropTypes from 'prop-types';
import { createContext, useMemo } from 'react';

import useLocalStorage from '../hooks/useLocalStorage';
import { ROLES } from '../constants/roles';

const initialAuthState = { role: null };

export const AuthContext = createContext({
  role: null,
  login: () => {},
  logout: () => {}
});

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useLocalStorage('educonnect-auth', initialAuthState);

  const login = (role) => {
    setAuthState({ role });
  };

  const logout = () => setAuthState(initialAuthState);

  const value = useMemo(
    () => ({
      role: authState?.role ?? null,
      login,
      logout
    }),
    [authState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node
};

export { ROLES };
