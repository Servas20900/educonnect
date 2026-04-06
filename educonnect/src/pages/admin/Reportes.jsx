import { useEffect, useMemo, useState } from 'react';
import {
  DataTable,
  PageHeader,
  SearchFilter,
  StatusBadge,
} from '../../components/ui';
import {
  fetchAuditoriaLogs,
  fetchReporteUsoSistema,
  fetchReportePorModulo,
  fetchReporteErrores,
} from '../../api/reportesService';

const formatErrorMessage = (error) => {
  if (!error) return 'Ocurrio un error inesperado';
  if (typeof error === 'string') return error;
  if (typeof error?.detail === 'string') return error.detail;
  if (typeof error?.error === 'string') return error.error;
  return 'No fue posible cargar los reportes';
};

const toDateTimeBounds = (fromDate, toDate) => ({
  fecha_inicio: fromDate ? `${fromDate}T00:00:00` : '',
  fecha_fin: toDate ? `${toDate}T23:59:59` : '',
});

const exportToCsv = (rows, filename) => {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? '')).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
};

export default function Reportes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [tab, setTab] = useState('auditoria');

  const [logs, setLogs] = useState([]);
  const [usoSistema, setUsoSistema] = useState([]);
  const [usoModulo, setUsoModulo] = useState([]);
  const [errores, setErrores] = useState([]);

  const [search, setSearch] = useState('');
  const [usuarioFilter, setUsuarioFilter] = useState('');
  const [moduloFilter, setModuloFilter] = useState('');
  const [resultadoFilter, setResultadoFilter] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const loadAuditoria = async () => {
    setLoading(true);
    setError('');
    try {
      const bounds = toDateTimeBounds(fechaInicio, fechaFin);
      const response = await fetchAuditoriaLogs({
        usuario: usuarioFilter,
        modulo: moduloFilter,
        resultado: resultadoFilter,
        fecha_inicio: bounds.fecha_inicio,
        fecha_fin: bounds.fecha_fin,
        ordering: '-fecha_hora',
      });
      setLogs(Array.isArray(response) ? response : response.results || []);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadReportes = async () => {
    setLoading(true);
    setError('');
    try {
      const [uso, modulo, erroresData] = await Promise.all([
        fetchReporteUsoSistema(),
        fetchReportePorModulo(),
        fetchReporteErrores(),
      ]);
      setUsoSistema(Array.isArray(uso) ? uso : []);
      setUsoModulo(Array.isArray(modulo) ? modulo : []);
      setErrores(Array.isArray(erroresData) ? erroresData : erroresData.results || []);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditoria();
    loadReportes();
  }, []);

  const logsFiltrados = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return logs;
    return logs.filter((log) =>
      [
        log.usuario_email,
        log.usuario_nombre,
        log.modulo,
        log.accion,
        log.resultado,
      ]
        .some((value) => String(value || '').toLowerCase().includes(query))
    );
  }, [logs, search]);

  const columnsAuditoria = [
    {
      key: 'fecha_hora',
      label: 'Fecha',
      render: (row) => (
        <span className="text-slate-700">{row.fecha_hora ? new Date(row.fecha_hora).toLocaleString() : '-'}</span>
      ),
    },
    {
      key: 'usuario',
      label: 'Usuario',
      render: (row) => <span className="font-medium text-slate-900">{row.usuario_email || row.usuario_nombre || 'Sistema'}</span>,
    },
    {
      key: 'modulo',
      label: 'Modulo',
      render: (row) => <span className="text-slate-700">{row.modulo || '-'}</span>,
    },
    {
      key: 'accion',
      label: 'Accion',
      render: (row) => <span className="text-slate-700">{row.accion || '-'}</span>,
    },
    {
      key: 'resultado',
      label: 'Resultado',
      render: (row) => <StatusBadge status={row.resultado || 'N/A'} size="sm" />,
    },
  ];

  const columnsUso = [
    {
      key: 'usuario',
      label: 'Usuario',
      render: (row) => <span className="font-medium text-slate-900">{row.usuario || 'Sistema'}</span>,
    },
    {
      key: 'total_acciones',
      label: 'Total Acciones',
      render: (row) => <span className="text-slate-700">{row.total_acciones ?? 0}</span>,
    },
    {
      key: 'ultima_accion',
      label: 'Ultima Accion',
      render: (row) => <span className="text-slate-700">{row.ultima_accion ? new Date(row.ultima_accion).toLocaleString() : '-'}</span>,
    },
  ];

  const columnsModulo = [
    {
      key: 'modulo',
      label: 'Modulo',
      render: (row) => <span className="font-medium text-slate-900">{row.modulo || '-'}</span>,
    },
    {
      key: 'total_acciones',
      label: 'Total Acciones',
      render: (row) => <span className="text-slate-700">{row.total_acciones ?? 0}</span>,
    },
  ];

  const columnsErrores = [
    {
      key: 'fecha',
      label: 'Fecha',
      render: (row) => <span className="text-slate-700">{row.fecha ? new Date(row.fecha).toLocaleString() : '-'}</span>,
    },
    {
      key: 'usuario',
      label: 'Usuario',
      render: (row) => <span className="font-medium text-slate-900">{row.usuario || 'Sistema'}</span>,
    },
    {
      key: 'metodo',
      label: 'Metodo',
      render: (row) => <span className="text-slate-700">{row.metodo || '-'}</span>,
    },
    {
      key: 'endpoint',
      label: 'Endpoint',
      render: (row) => <span className="text-slate-700">{row.endpoint || '-'}</span>,
    },
    {
      key: 'status_code',
      label: 'HTTP',
      render: (row) => <StatusBadge status={String(row.status_code || '-')} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Reportes y Auditoria"
        subtitle="Monitorea trazabilidad del sistema, uso por modulo y errores operativos"
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('auditoria')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === 'auditoria' ? 'bg-[#185fa5] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Auditoria
        </button>
        <button
          type="button"
          onClick={() => setTab('uso')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === 'uso' ? 'bg-[#185fa5] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Uso y Errores
        </button>
      </div>

      {tab === 'auditoria' ? (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1 text-sm">
              <span className="block font-medium text-slate-700">Fecha inicio</span>
              <input
                type="date"
                value={fechaInicio}
                onChange={(event) => setFechaInicio(event.target.value)}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="block font-medium text-slate-700">Fecha fin</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(event) => setFechaFin(event.target.value)}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="block font-medium text-slate-700">Usuario</span>
              <input
                type="text"
                value={usuarioFilter}
                onChange={(event) => setUsuarioFilter(event.target.value)}
                placeholder="Email, username o nombre"
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="block font-medium text-slate-700">Modulo</span>
              <input
                type="text"
                value={moduloFilter}
                onChange={(event) => setModuloFilter(event.target.value)}
                placeholder="Ej: comites"
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]">
            <select
              value={resultadoFilter}
              onChange={(event) => setResultadoFilter(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
            >
              <option value="">Todos los resultados</option>
              <option value="Exitoso">Exitoso</option>
              <option value="Error">Error</option>
            </select>
            <button
              type="button"
              onClick={loadAuditoria}
              className="rounded-md bg-[#185fa5] px-4 py-2 text-sm font-medium text-white hover:bg-[#0c447c]"
              disabled={loading}
            >
              {loading ? 'Aplicando...' : 'Aplicar filtros'}
            </button>
            <button
              type="button"
              onClick={() => exportToCsv(logsFiltrados, 'auditoria_logs')}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              disabled={!logsFiltrados.length}
            >
              Exportar CSV
            </button>
          </div>

          <SearchFilter
            value={search}
            onChange={setSearch}
            placeholder="Buscar dentro de resultados filtrados..."
          />

          <DataTable
            columns={columnsAuditoria}
            data={logsFiltrados}
            loading={loading}
            emptyMessage="No se encontraron logs con esos filtros"
          />
        </section>
      ) : (
        <div className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Uso del sistema (30 dias)</h3>
              <button
                type="button"
                onClick={() => exportToCsv(usoSistema, 'reporte_uso_sistema')}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                disabled={!usoSistema.length}
              >
                Exportar CSV
              </button>
            </div>
            <DataTable columns={columnsUso} data={usoSistema} loading={loading} emptyMessage="No hay datos de uso" />
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Actividad por modulo</h3>
              <button
                type="button"
                onClick={() => exportToCsv(usoModulo, 'reporte_por_modulo')}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                disabled={!usoModulo.length}
              >
                Exportar CSV
              </button>
            </div>
            <DataTable columns={columnsModulo} data={usoModulo} loading={loading} emptyMessage="No hay actividad registrada" />
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Errores del sistema (30 dias)</h3>
              <button
                type="button"
                onClick={() => exportToCsv(errores, 'reporte_errores')}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                disabled={!errores.length}
              >
                Exportar CSV
              </button>
            </div>
            <DataTable columns={columnsErrores} data={errores} loading={loading} emptyMessage="No hay errores registrados" />
          </section>
        </div>
      )}
    </div>
  );
}
