import { useNavigate } from 'react-router-dom';

export default function Login(){
  const navigate = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    // TODO: Integrate auth API; on success redirect
    navigate('/dashboard');
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold">Iniciar sesión</h2>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm text-gray-600">Correo</label>
          <input type="email" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-200" placeholder="nombre@colegio.edu" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Contraseña</label>
          <input type="password" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-200" placeholder="••••••••" />
        </div>
        <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700">Ingresar</button>
      </form>
      <p className="mt-4 text-sm text-gray-500">¿No tienes cuenta? <a href="/register" className="text-indigo-700 hover:underline">Regístrate</a></p>
    </div>
  );
}
