import { useState, useEffect } from 'react';
import { fetchActas, fetchReportesComite } from '../../api/comitesService';
import { api } from '../../api/authService';
import { DataTable, PageHeader, BtnDescargar } from '../../components/ui';

export default function DocumentosComite() {
  const [actas, setActas] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDocumentos();
  }, []);

  const loadDocumentos = async () => {
    setLoading(true);
    setError('');
    try {
      const [actasData, reportesData] = await Promise.all([
        fetchActas(),
        fetchReportesComite()
      ]);
      setActas(Array.isArray(actasData) ? actasData : actasData.results || []);
      setReportes(Array.isArray(reportesData) ? reportesData : reportesData.results || []);
    } catch {
      setError('Error al cargar documentos del comité');
    } finally {
      setLoading(false);
    }
  };

  const resolveDownloadUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const base = api.defaults.baseURL || '';
    const normalized = path.startsWith('/') ? path.slice(1) : path;
    return `${base}${normalized}`;
  };

  const handleDownload = async (path, filename) => {
    const url = resolveDownloadUrl(path);
    if (!url) return;
    try {
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch {
      alert('Error al descargar el archivo');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getEstadoBadgeClass = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'aprobado':
      case 'aprobada': return 'bg-green-100 text-green-800';
      case 'borrador': return 'bg-yellow-100 text-yellow-800';
      case 'revision': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const columnasActas = [
    {
      key: 'numero_acta',
      label: 'Número',
      render: (acta) => <span className="text-slate-900">{acta.numero_acta || 'N/A'}</span>,
    },
    {
      key: 'contenido',
      label: 'Contenido',
      render: (acta) => (
        <div className="max-w-xs truncate text-slate-700">{acta.contenido || 'Sin contenido'}</div>
      ),
    },
    {
      key: 'fecha_elaboracion',
      label: 'Fecha',
      render: (acta) => <span className="text-slate-500">{formatDate(acta.fecha_elaboracion)}</span>,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (acta) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getEstadoBadgeClass(acta.estado)}`}>
          {acta.estado || 'N/A'}
        </span>
      ),
    },
    {
      key: 'elaborada_por',
      label: 'Elaborada por',
      render: (acta) => <span className="text-slate-500">{acta.elaborada_por_username || 'N/A'}</span>,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: () => <span className="text-xs text-slate-400">Sin adjunto</span>,
    },
  ];

  const columnasReportes = [
    {
      key: 'titulo',
      label: 'Título',
      render: (r) => <span className="font-medium text-slate-900">{r.titulo || 'Sin título'}</span>,
    },
    {
      key: 'tipo_informe',
      label: 'Tipo',
      render: (r) => <span className="text-slate-500">{r.tipo_informe || 'N/A'}</span>,
    },
    {
      key: 'contenido',
      label: 'Contenido',
      render: (r) => (
        <div className="max-w-xs truncate text-slate-700">{r.contenido || 'Sin contenido'}</div>
      ),
    },
    {
      key: 'fecha_elaboracion',
      label: 'Fecha',
      render: (r) => <span className="text-slate-500">{formatDate(r.fecha_elaboracion)}</span>,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (r) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getEstadoBadgeClass(r.estado)}`}>
          {r.estado || 'N/A'}
        </span>
      ),
    },
    {
      key: 'elaborado_por',
      label: 'Elaborado por',
      render: (r) => <span className="text-slate-500">{r.elaborado_por_username || 'N/A'}</span>,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (r) =>
        r.archivo_adjunto ? (
          <BtnDescargar onClick={() => handleDownload(r.archivo_adjunto, `reporte_${r.id}.pdf`)} />
        ) : (
          <span className="text-xs text-slate-400">Sin adjunto</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos del Comité"
        subtitle="Visualiza y descarga tus actas y reportes."
      />

      {error ? (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h3 className="text-lg font-semibold text-slate-900">Actas ({actas.length})</h3>
        </div>
        <div className="p-4">
          <DataTable
            columns={columnasActas}
            data={actas}
            loading={loading}
            pageSize={8}
            emptyMessage="No hay actas disponibles para este comité."
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h3 className="text-lg font-semibold text-slate-900">Reportes ({reportes.length})</h3>
        </div>
        <div className="p-4">
          <DataTable
            columns={columnasReportes}
            data={reportes}
            loading={loading}
            pageSize={8}
            emptyMessage="No hay reportes disponibles para este comité."
          />
        </div>
      </section>
    </div>
  );
}
