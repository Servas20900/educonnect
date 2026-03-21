--- src/layout/PublicLayout/index.jsx ---
```jsx
import { Outlet, Link } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white text-gray-800">
      <header className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-extrabold text-indigo-700 text-xl sm:text-2xl tracking-wide">EduConnect</Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/" className="hover:text-indigo-700">Inicio</Link>
            <Link to="/login" className="hover:text-indigo-700">Iniciar sesión</Link>
            <Link to="/register" className="hover:text-indigo-700">Registrarse</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10"><Outlet /></main>
      <footer className="mt-10 border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-500">© {new Date().getFullYear()} EduConnect</div>
      </footer>
    </div>
  );
}
```

--- src/pages/public/Home.jsx ---
```jsx
export default function PublicHome(){
  return (
    <section className="grid gap-8 lg:grid-cols-2">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bienvenido a EduConnect</h1>
        <p className="mt-3 text-gray-600">Gestiona tu comunidad educativa con una plataforma moderna y fácil de usar.</p>
        <div className="mt-6 flex gap-3">
          <a href="/login" className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700">Iniciar sesión</a>
          <a href="/register" className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50">Registrarse</a>
        </div>
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-indigo-50 p-4">
            <p className="text-sm text-gray-600">Circulares y avisos</p>
            <p className="mt-2 text-xl font-semibold text-indigo-700">Comunicación</p>
          </div>
          <div className="rounded-xl bg-teal-50 p-4">
            <p className="text-sm text-gray-600">Horarios y reuniones</p>
            <p className="mt-2 text-xl font-semibold text-teal-700">Organización</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-4">
            <p className="text-sm text-gray-600">Evaluaciones y asistencia</p>
            <p className="mt-2 text-xl font-semibold text-rose-700">Seguimiento</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-sm text-gray-600">Reportes y seguridad</p>
            <p className="mt-2 text-xl font-semibold text-amber-700">Control</p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

--- src/pages/public/Login.jsx ---
```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../../hooks/useLogin';
import useAuth from '../../hooks/useAuth';

// Mapear roles desde el backend a rutas
const getRoleRedirect = (rolBackend) => {
  if (!rolBackend) return '/dashboard';
  
  const rolLower = rolBackend.toLowerCase();
  
  if (rolLower.includes('admin')) return '/dashboard';
  if (rolLower.includes('docente')) return '/docente/dashboard';
  if (rolLower.includes('estudiante')) return '/estudiante/home';
  if (rolLower.includes('comite')) return '/comite/home';
  
  return '/dashboard';
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { executeLogin, loading, error } = useLogin();

  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const result = await executeLogin(credentials);

    if (result.success) {
      // El rol viene del backend en result.data.role
      const rolBackend = result.data?.role || 'usuario';
      
      console.log("Login exitoso, rol obtenido del backend:", rolBackend);
      
      // Actualizar el estado del contexto de auth
      login({
        user: credentials.username,
        role: rolBackend
      });

      // Navegar después de actualizar el estado
      const redirectPath = getRoleRedirect(rolBackend) || '/dashboard';
      console.log("Redirigiendo a:", redirectPath);
      
      // Usar setTimeout para asegurar que el estado se actualice primero
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 0);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold">Iniciar sesión</h2>

      {error && (
        <p className="text-red-500 mt-2 text-sm bg-red-50 p-2 rounded">
          {error.message || 'Usuario o contraseña incorrectos'}
        </p>
      )}

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm text-gray-600">Usuario (Cédula)</label>
          <input
            type="text"
            name="username"
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-200"
            placeholder="Tu usuario"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Contraseña</label>
          <input
            type="password"
            name="password"
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-200"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-lg bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700 ${loading ? 'opacity-50' : ''}`}
        >
          {loading ? 'Validando...' : 'Ingresar'}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-500">
        ¿No tienes cuenta?{' '}
        <a href="/register" className="text-indigo-700 hover:underline">
          Regístrate
        </a>
      </p>
    </div>
  );
}
```

--- src/pages/public/Register.jsx ---
```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegister } from '../../hooks/useRegister';

export default function Register() {
  const navigate = useNavigate();
  const { executeRegister, loading, error } = useRegister();
  const [formData, setFormData] = useState({
    nombre: '',
    primer_apellido: '',
    username: '',
    email: '',
    password: '',
    fecha_nacimiento: '',
    genero: '',
    rol: 'estudiante'  // Rol por defecto
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const result = await executeRegister(formData);
    if (result.success) {
      navigate('/login');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold">Crear cuenta</h2>
      {error && (
        <div className="text-red-500 mt-2 text-sm bg-red-50 p-2 rounded space-y-1">
          <p>{error.message || 'No fue posible registrar el usuario'}</p>
          {error.details && typeof error.details === 'object' && (
            <ul className="list-disc ml-5">
              {Object.entries(error.details).map(([field, value]) => (
                <li key={field}>
                  {field}: {Array.isArray(value) ? value.join(', ') : String(value)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600">Nombre</label>
            <input type="text" name="nombre" onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Primer Apellido</label>
            <input type="text" name="primer_apellido" onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" required />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600">Identificacion</label>
          <input type="text" name="username" onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" required />
        </div>

        <div>
          <label className="block text-sm text-gray-600">Correo electrónico</label>
          <input type="email" name="email" onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" required />
        </div>

        <div>
          <label className="block text-sm text-gray-600">Fecha de Nacimiento</label>
          <input type="date" name="fecha_nacimiento" onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" required />
        </div>

        <div>
          <label className="block text-sm text-gray-600">Género</label>
          <select name="genero" onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 bg-white" required>
            <option value="">Seleccione...</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="otro">Otro</option>
            <option value="prefiero_no_decir">Prefiero no decir</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600">Contraseña</label>
          <input type="password" name="password" onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" required />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-lg bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700 ${loading ? 'opacity-50' : ''}`}
        >
          {loading ? 'Procesando...' : 'Registrarse'}
        </button>
      </form>
    </div>
  );
}
```

--- src/hooks/useLogin.jsx ---
```jsx
import { useState } from 'react';
import { loginUsuario } from '../api/authService';

export const useLogin = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const executeLogin = async (credentials) => {
        setLoading(true);
        setError(null);
        try {
            const data = await loginUsuario(credentials);
            setLoading(false);
            return { success: true, data };
        } catch (err) {
            setLoading(false);
            setError(err);
            return { success: false, error: err };
        }
    };

    return { executeLogin, loading, error };
};
```

--- src/hooks/useRegister.jsx ---
```jsx
import { useState } from 'react';
import { registrarUsuario } from '../api/authService';

export const useRegister = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const executeRegister = async (userData) => {
        setLoading(true);
        setError(null);
        try {
            const data = await registrarUsuario(userData);
            setLoading(false);
            return { success: true, data };
        } catch (err) {
            setLoading(false);
            setError(err);
            return { success: false, error: err };
        }
    };

    return { executeRegister, loading, error };
};
```

--- src/hooks/useAuth.js ---
```js
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function useAuth() {
  return useContext(AuthContext);
}
```

--- src/contexts/AuthContext.jsx ---
```jsx
import PropTypes from 'prop-types';
import { createContext, useMemo, useState, useEffect, useCallback } from 'react';
import { getSessionStatus, logoutUsuario } from '../api/authService';
import Loader from '../components/ui/Loader';

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
```

--- componentes-compartidos-entre-Home-Login-Register.txt ---
```txt
No hay componentes React compartidos (importados) entre Home.jsx, Login.jsx y Register.jsx.

Comparten solo elementos HTML/Tailwind (input, button, mensajes inline), pero no un componente custom reutilizable.
```

--- validacion-formularios.txt ---
```txt
La validación es manual/nativa del navegador mediante atributos HTML como "required" y tipos de input (email, date, password).

No se usa react-hook-form ni Formik en Login.jsx ni Register.jsx.
```
