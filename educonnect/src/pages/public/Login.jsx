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
      
      login({
        user: credentials.username,
        role: rolBackend
      });

      console.log("Login exitoso, rol obtenido del backend:", rolBackend);
      navigate(getRoleRedirect(rolBackend) || '/dashboard', { replace: true });
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold">Iniciar sesión</h2>

      {error && (
        <p className="text-red-500 mt-2 text-sm bg-red-50 p-2 rounded">
          Usuario o contraseña incorrectos
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