import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import useAuth from '../../hooks/useAuth';

export default function NoAutorizado() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const buttonText = useMemo(() => (role ? 'Ir al dashboard' : 'Ir al login'), [role]);

  const handleGoBack = () => {
    if (role) {
      navigate('/dashboard');
      return;
    }

    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-16">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 md:p-10">
        <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Acceso restringido</h1>
        <p className="mt-4 text-base text-slate-600 md:text-lg">
          No tenés permiso para acceder a esta sección
        </p>
        <button
          type="button"
          onClick={handleGoBack}
          className="mt-8 rounded-lg bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
