
export default function Dashboard(){
  const stats = [
    { label: 'Usuarios activos', value: '1,248', trend: '+5.2%' },
    { label: 'Circulares publicadas', value: '86', trend: '+2' },
    { label: 'Reuniones esta semana', value: '12', trend: '-1' }
  ];

  const quickActions = [
    { label: 'Nueva Circular', href: '/circulares' },
    { label: 'Agendar Reunión', href: '/comite/reunion' },
    { label: 'Gestionar Usuarios', href: '/usuarios' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Panel de administración</h2>
          <p className="text-sm text-gray-500">Resumen de actividad y accesos rápidos</p>
        </div>
        <a href="/reportes" className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700 transition">
          Ver reportes
        </a>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-white/70 backdrop-blur p-5 shadow-sm ring-1 ring-black/5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-gray-900">{s.value}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${s.trend.startsWith('-') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{s.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Actividad reciente</h3>
            <a href="/reportes" className="text-sm text-indigo-600 hover:text-indigo-700">Ver todo</a>
          </div>
          <ul className="mt-4 space-y-3">
            {[
              { t: 'Usuario creó una circular', d: 'Hace 2 horas' },
              { t: 'Se actualizó el horario de 10°A', d: 'Ayer' },
              { t: 'Nueva reunión del comité agendada', d: 'Hace 3 días' }
            ].map((item, idx) => (
              <li key={idx} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                <span className="text-sm text-gray-700">{item.t}</span>
                <span className="text-xs text-gray-400">{item.d}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick actions */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h3 className="text-lg font-semibold">Accesos rápidos</h3>
          <div className="mt-4 grid grid-cols-1 gap-3">
            {quickActions.map((a) => (
              <a key={a.label} href={a.href} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 transition">
                <span>{a.label}</span>
                <span className="text-indigo-600">→</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
