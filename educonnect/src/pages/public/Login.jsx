import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '../../hooks/useLogin';
import useAuth from '../../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { executeLogin, loading, error } = useLogin();
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleChange = (e) =>
    setCredentials((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const result = await executeLogin(credentials);
    if (result.success) {
      login({ role: result.data?.role, user: result.data?.user || credentials.username });
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div
      className="w-full max-w-sm rounded-xl p-8 border"
      style={{ background: '#fff', borderColor: '#e2e4e9' }}
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src="https://www.arcgis.com/sharing/rest/content/items/9c260e88f4cf4841ae1dcbbaa7f8db4f/resources/images/widget_2/1753990272849.jpg"
            alt="logo"
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-sm font-medium" style={{ color: '#0b2545' }}>EduConnect</span>
      </div>

      <p className="text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: '#378add' }}>
        Acceso institucional
      </p>
      <h2 className="text-lg font-medium mb-1" style={{ color: '#0b2545' }}>Iniciar sesión</h2>
      <p className="text-xs leading-relaxed mb-5" style={{ color: '#8a8f9e' }}>
        Ingresá tu usuario y contraseña institucional.
      </p>

      {error && (
        <div
          className="text-xs rounded-lg px-3 py-2.5 mb-4"
          style={{ background: '#fef2f2', color: '#b91c1c', border: '0.5px solid #fecaca' }}
        >
          {error.message || 'Usuario o contraseña incorrectos'}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#4a5060' }}>
            Usuario (cédula)
          </label>
          <input
            type="text"
            name="username"
            value={credentials.username}
            onChange={handleChange}
            required
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-shadow"
            style={{ border: '0.5px solid #d8dae0', background: '#fafbfc', color: '#0b2545' }}
            onFocus={(e) => { e.target.style.borderColor = '#378add'; e.target.style.boxShadow = '0 0 0 3px rgba(55,138,221,.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#d8dae0'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#4a5060' }}>
            Contraseña
          </label>
          <input
            type="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-shadow"
            style={{ border: '0.5px solid #d8dae0', background: '#fafbfc', color: '#0b2545' }}
            onFocus={(e) => { e.target.style.borderColor = '#378add'; e.target.style.boxShadow = '0 0 0 3px rgba(55,138,221,.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#d8dae0'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity mt-1"
          style={{ background: '#0b2545', opacity: loading ? .6 : 1 }}
        >
          {loading ? 'Validando...' : 'Ingresar al sistema'}
        </button>
      </form>

      <p className="text-xs text-center mt-4" style={{ color: '#8a8f9e' }}>
        ¿No tenés cuenta?{' '}
        <Link to="/register" className="font-medium" style={{ color: '#378add' }}>
          Registrarse
        </Link>
      </p>
    </div>
  );
}
