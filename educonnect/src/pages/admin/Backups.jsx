import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import {
  DataTable,
  PageHeader,
  SearchFilter,
  StatusBadge,
} from '../../components/ui';
import {
  descargarExportacionAdmin,
  exportarDocentes,
  exportarEstudiantes,
  fetchAdminExportaciones,
} from '../../api/backupsService';

const FORMAT_OPTIONS = [
  { value: 'XLSX', label: 'Excel (XLSX)' },
];

const formatError = (error) => {
  if (!error) return 'Ocurrio un error inesperado';
  if (typeof error === 'string') return error;
  if (typeof error?.detail === 'string') return error.detail;
  if (typeof error?.error === 'string') return error.error;
  return 'No fue posible completar la accion';
};

const guessExtension = (formato) => {
  return 'xlsx';
};

export default function Backups() {
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [searchExport, setSearchExport] = useState('');

  const [formatoDocentes, setFormatoDocentes] = useState('XLSX');
  const [formatoEstudiantes, setFormatoEstudiantes] = useState('XLSX');

  const [exportaciones, setExportaciones] = useState([]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const exportsResp = await fetchAdminExportaciones();
      setExportaciones(Array.isArray(exportsResp) ? exportsResp : exportsResp.results || []);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredExportaciones = useMemo(() => {
    const query = searchExport.trim().toLowerCase();
    if (!query) return exportaciones;
    return exportaciones.filter((item) =>
      [item.nombre, item.formato, item.actualizado]
        .some((value) => String(value || '').toLowerCase().includes(query))
    );
  }, [exportaciones, searchExport]);

  const handleGenerateDocentes = async () => {
    setLoading(true);
    setError('');
    try {
      await exportarDocentes(formatoDocentes);
      await loadData();
      setSuccess('Exportacion de docentes generada correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(formatError(err));
      setLoading(false);
    }
  };

  const handleGenerateEstudiantes = async () => {
    setLoading(true);
    setError('');
    try {
      await exportarEstudiantes(formatoEstudiantes);
      await loadData();
      setSuccess('Exportacion de estudiantes generada correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(formatError(err));
      setLoading(false);
    }
  };

  const handleDownload = async (row) => {
    setDownloadingId(row.id);
    setError('');
    try {
      const blob = await descargarExportacionAdmin(row.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${row.nombre || 'exportacion'}.${guessExtension(row.formato)}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setDownloadingId(null);
    }
  };

  const columnsExportaciones = [
    {
      key: 'nombre',
      label: 'Nombre',
      render: (row) => <span className="font-medium text-slate-900">{row.nombre}</span>,
    },
    {
      key: 'formato',
      label: 'Formato',
      render: (row) => <StatusBadge status={row.formato || 'N/A'} size="sm" />,
    },
    {
      key: 'actualizado',
      label: 'Fecha',
      render: (row) => <span className="text-slate-700">{row.actualizado ? new Date(row.actualizado).toLocaleString() : '-'}</span>,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleDownload(row)}
          disabled={downloadingId === row.id}
          className="rounded-md bg-[#185fa5] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#0c447c] disabled:opacity-60"
        >
          {downloadingId === row.id ? 'Descargando...' : 'Descargar'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Backups y Exportaciones"
        subtitle="Genera exportaciones administrativas y define politicas de retencion de datos"
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Exportaciones administrativas</h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-sm font-semibold text-slate-900">Exportar lista de docentes</h4>
            <p className="mt-1 text-xs text-slate-500">Generar y descargar listado de docentes en Excel.</p>
            <div className="mt-3 flex gap-2">
              <select
                value={formatoDocentes}
                onChange={(event) => setFormatoDocentes(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
              >
                {FORMAT_OPTIONS.map((format) => (
                  <option key={format.value} value={format.value}>{format.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleGenerateDocentes}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md bg-[#185fa5] px-4 py-2 text-sm font-medium text-white hover:bg-[#0c447c] disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                Generar
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-sm font-semibold text-slate-900">Exportar lista de estudiantes</h4>
            <p className="mt-1 text-xs text-slate-500">Generar y descargar listado de estudiantes en Excel.</p>
            <div className="mt-3 flex gap-2">
              <select
                value={formatoEstudiantes}
                onChange={(event) => setFormatoEstudiantes(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
              >
                {FORMAT_OPTIONS.map((format) => (
                  <option key={format.value} value={format.value}>{format.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleGenerateEstudiantes}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md bg-[#185fa5] px-4 py-2 text-sm font-medium text-white hover:bg-[#0c447c] disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                Generar
              </button>
            </div>
          </div>
        </div>

        <SearchFilter
          value={searchExport}
          onChange={setSearchExport}
          placeholder="Buscar exportaciones por nombre o formato..."
        />

        <DataTable
          columns={columnsExportaciones}
          data={filteredExportaciones}
          loading={loading}
          emptyMessage="No hay exportaciones generadas"
        />
      </section>

      {success ? (
        <div className="fixed bottom-4 right-4 z-[1300] rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-lg">
          {success}
        </div>
      ) : null}
    </div>
  );
}
