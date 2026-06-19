import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, Users } from 'lucide-react';
import { PageHeader } from '../../components/ui';
import { fetchComites } from '../../api/comitesService';

const TIPO_COLORS = {
  patronato: 'bg-blue-100 text-blue-800',
  deportivo: 'bg-green-100 text-green-800',
  cultural: 'bg-purple-100 text-purple-800',
  disciplinario: 'bg-red-100 text-red-800',
};

function TipoBadge({ tipo }) {
  const label = String(tipo || '').toLowerCase();
  const cls = TIPO_COLORS[label] || 'bg-slate-100 text-slate-700';
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {tipo || 'General'}
    </span>
  );
}

function NavBtn({ label, Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 flex-col items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-medium text-slate-700 transition-colors hover:border-[#185fa5] hover:bg-[#e6f1fb] hover:text-[#185fa5]"
    >
      <Icon size={18} strokeWidth={1.75} />
      {label}
    </button>
  );
}

export default function ComiteHub() {
  const navigate = useNavigate();
  const [comites, setComites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComites({ estado: 'activo', mis_comites: true })
      .then((data) => setComites(Array.isArray(data) ? data : data?.results || []))
      .catch(() => setError('No se pudieron cargar los comités. Intenta de nuevo.'))
      .finally(() => setLoading(false));
  }, []);

  const goTo = (path, comite) => {
    const params = new URLSearchParams({
      comite_id: comite.id,
      comite_nombre: comite.nombre,
    });
    navigate(`/comite/${path}?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Mis Comités" subtitle="Selecciona un comité para ver sus reuniones, actas y roles" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis Comités"
        subtitle="Selecciona un comité para ver sus reuniones, actas y roles"
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && comites.length === 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
          <p className="text-sm font-medium text-amber-800">No estás asignado a ningún comité activo.</p>
          <p className="mt-1 text-xs text-amber-700">Contacta al administrador para que te asigne a un comité.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {comites.map((comite) => (
          <div
            key={comite.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-slate-900 leading-snug">{comite.nombre}</h3>
                <TipoBadge tipo={comite.tipo_comite} />
              </div>
              {comite.descripcion && (
                <p className="line-clamp-2 text-sm text-slate-500">{comite.descripcion}</p>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <NavBtn label="Reuniones" Icon={Calendar} onClick={() => goTo('reuniones', comite)} />
              <NavBtn label="Actas" Icon={FileText} onClick={() => goTo('actas', comite)} />
              <NavBtn label="Roles" Icon={Users} onClick={() => goTo('roles', comite)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
