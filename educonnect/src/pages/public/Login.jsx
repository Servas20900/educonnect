import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import useAuth from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';

const ROLE_REDIRECT = {
  [ROLES.ADMIN]: '/dashboard',
  [ROLES.DOCENTE]: '/docente/dashboard',
  [ROLES.ESTUDIANTE]: '/estudiante/home'
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState(ROLES.ADMIN);

  const onSubmit = (e) => {
    e.preventDefault();
    login(selectedRole);
    navigate(ROLE_REDIRECT[selectedRole] || '/dashboard', { replace: true });
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold">Iniciar sesión</h2>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm text-gray-600">Correo</label>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-200"
            placeholder="nombre@colegio.edu"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Contraseña</label>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-200"
            placeholder="••••••••"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Nivel de acceso</label>
          <select
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-200"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value={ROLES.ADMIN}>Administrador (todo el sistema)</option>
            <option value={ROLES.DOCENTE}>Docente (docentes y comité)</option>
            <option value={ROLES.ESTUDIANTE}>Estudiante (solo estudiante)</option>
          </select>
        </div>
        <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700">
          Ingresar
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
