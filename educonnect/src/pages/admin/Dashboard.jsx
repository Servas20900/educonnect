
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Users, FileText, BarChart3, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { fetchCirculares } from '../../api/circulares';
import { fetchGrupos } from '../../api/grupos';
import { fetchUsuarios } from '../../api/permisosService';
import { fetchAuditoriaLogs } from '../../api/reportesService';
import { getReuniones } from '../../api/reuniones';

const toList = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

const parseDate = (rawDate) => {
  if (!rawDate) return null;
  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isBetween = (date, start, end) => date >= start && date < end;

const countByRange = (items, getDate, start, end) =>
  items.reduce((acc, item) => {
    const date = parseDate(getDate(item));
    return date && isBetween(date, start, end) ? acc + 1 : acc;
  }, 0);

const formatTrend = (current, previous) => {
  if (current === 0 && previous === 0) {
    return { value: '0%', positive: true, caption: 'Sin cambios' };
  }

  if (previous === 0) {
    return { value: '+100%', positive: true, caption: 'Nuevo crecimiento' };
  }

  const percentage = ((current - previous) / previous) * 100;
  const rounded = `${percentage > 0 ? '+' : ''}${Math.round(percentage)}%`;

  return {
    value: rounded,
    positive: percentage >= 0,
    caption: 'vs periodo anterior'
  };
};

const formatRelativeTime = (rawDate) => {
  const date = parseDate(rawDate);
  if (!date) return 'Fecha no disponible';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Hace instantes';
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays < 7) return `Hace ${diffDays} d`;

  return date.toLocaleDateString('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export default function Dashboard() {
  const [usuarios, setUsuarios] = useState([]);
  const [circulares, setCirculares] = useState([]);
  const [reuniones, setReuniones] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');

    const [usuariosResult, circularesResult, reunionesResult, gruposResult, logsResult] =
      await Promise.allSettled([
        fetchUsuarios(),
        fetchCirculares(),
        getReuniones(),
        fetchGrupos(),
        fetchAuditoriaLogs({ ordering: '-fecha_hora' })
      ]);

    const parseSettledList = (result) =>
      result.status === 'fulfilled' ? toList(result.value) : [];

    setUsuarios(parseSettledList(usuariosResult));
    setCirculares(parseSettledList(circularesResult));
    setReuniones(parseSettledList(reunionesResult));
    setGrupos(parseSettledList(gruposResult));
    setAuditLogs(parseSettledList(logsResult));

    const failedRequests = [
      usuariosResult,
      circularesResult,
      reunionesResult,
      gruposResult,
      logsResult
    ].filter((result) => result.status === 'rejected').length;

    if (failedRequests > 0) {
      setError(
        failedRequests === 5
          ? 'No fue posible cargar datos del dashboard en este momento.'
          : 'Se cargó el dashboard parcialmente. Algunos datos no están disponibles.'
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const { statCards, actividadReciente } = useMemo(() => {
    const now = new Date();

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const day = now.getDay();
    const daysToMonday = (day + 6) % 7;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const nextWeekStart = new Date(weekStart);
    nextWeekStart.setDate(weekStart.getDate() + 7);
    const previousWeekStart = new Date(weekStart);
    previousWeekStart.setDate(weekStart.getDate() - 7);

    const usuariosActivos = usuarios.filter((usuario) => usuario.is_active).length;

    const usuariosMesActual = countByRange(
      usuarios,
      (usuario) => usuario.fecha_registro,
      monthStart,
      nextMonthStart
    );

    const usuariosMesAnterior = countByRange(
      usuarios,
      (usuario) => usuario.fecha_registro,
      previousMonthStart,
      monthStart
    );

    const trendUsuarios = formatTrend(usuariosMesActual, usuariosMesAnterior);

    const circularesMesActual = countByRange(
      circulares,
      (circular) => circular.fecha_creacion,
      monthStart,
      nextMonthStart
    );

    const circularesMesAnterior = countByRange(
      circulares,
      (circular) => circular.fecha_creacion,
      previousMonthStart,
      monthStart
    );

    const trendCirculares = formatTrend(circularesMesActual, circularesMesAnterior);

    const reunionesSemanaActual = countByRange(
      reuniones,
      (reunion) => reunion.fecha,
      weekStart,
      nextWeekStart
    );

    const reunionesSemanaAnterior = countByRange(
      reuniones,
      (reunion) => reunion.fecha,
      previousWeekStart,
      weekStart
    );

    const trendReuniones = formatTrend(reunionesSemanaActual, reunionesSemanaAnterior);

    const gruposActivos = grupos.filter((grupo) =>
      String(grupo.estado || '').toLowerCase().includes('activo')
    ).length;

    const statCardsData = [
      {
        label: 'Usuarios activos',
        value: usuariosActivos,
        trend: trendUsuarios,
        helper: `${usuariosMesActual} registros este mes`
      },
      {
        label: 'Circulares publicadas',
        value: circulares.length,
        trend: trendCirculares,
        helper: `${circularesMesActual} creadas este mes`
      },
      {
        label: 'Reuniones esta semana',
        value: reunionesSemanaActual,
        trend: trendReuniones,
        helper: `${reuniones.length} registradas en total`
      },
      {
        label: 'Grupos académicos',
        value: grupos.length,
        trend: {
          value: `${gruposActivos}`,
          positive: true,
          caption: 'activos'
        },
        helper: `${Math.max(grupos.length - gruposActivos, 0)} inactivos`
      }
    ];

    const actividad = [...auditLogs]
      .sort((a, b) => {
        const first = parseDate(a.fecha_hora)?.getTime() || 0;
        const second = parseDate(b.fecha_hora)?.getTime() || 0;
        return second - first;
      })
      .slice(0, 6)
      .map((log) => ({
        id: log.id,
        titulo: log.descripcion || `${log.accion} en ${log.modulo}`,
        modulo: log.modulo || 'General',
        resultado: log.resultado || 'N/A',
        tiempo: formatRelativeTime(log.fecha_hora)
      }));

    return {
      statCards: statCardsData,
      actividadReciente: actividad
    };
  }, [usuarios, circulares, reuniones, grupos, auditLogs]);

  const quickActions = [
    { label: 'Nueva Circular', href: '/circulares' },
    { label: 'Agendar Reunión', href: '/comite/reunion' },
    { label: 'Gestionar Roles y Permisos', href: '/permisos' },
    { label: 'Ver Reportes', href: '/reportes' }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Panel de administración</h2>
          <p className="text-sm text-gray-500">Métricas actualizadas en tiempo real según actividad del sistema</p>
        </div>
        <button
          type="button"
          onClick={loadDashboardData}
          disabled={loading}
          className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Actualizando...' : 'Actualizar datos'}
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl bg-white/70 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur">
            <p className="text-sm text-gray-500">{card.label}</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-2xl font-semibold text-gray-900">{card.value}</span>
              <span
                className={`rounded-full px-2 py-1 text-xs ${
                  card.trend.positive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {card.trend.value}
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">{card.trend.caption} · {card.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Actividad reciente</h3>
            <Link to="/reportes" className="text-sm text-indigo-600 hover:text-indigo-700">
              Ver todo
            </Link>
          </div>

          {loading && actividadReciente.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Cargando actividad...</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {actividadReciente.length > 0 ? (
                actividadReciente.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-2 rounded-lg border border-gray-100 p-3 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm text-gray-700">{item.titulo}</p>
                      <p className="text-xs text-gray-500">
                        {item.modulo} · {item.resultado}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">{item.tiempo}</span>
                  </li>
                ))
              ) : (
                <li className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                  No hay eventos recientes para mostrar.
                </li>
              )}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h3 className="text-lg font-semibold">Accesos rápidos</h3>
          <div className="mt-4 grid grid-cols-1 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.href}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 text-sm text-gray-700 transition hover:border-indigo-200 hover:bg-indigo-50"
              >
                <span>{action.label}</span>
                <span className="text-indigo-600">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
