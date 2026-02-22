import { useState, useEffect } from 'react';
import { fetchActas, fetchReportesComite } from '../../api/comitesService';
import { api } from '../../api/authService';

export default function DocumentosComite() {
  const [actas, setActas] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar documentos al montar
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
    } catch (err) {
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
      const response = await api.get(url, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      alert('Error al descargar el archivo');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getEstadoBadgeClass = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'aprobado':
      case 'aprobada':
        return 'bg-green-100 text-green-800';
      case 'borrador':
        return 'bg-yellow-100 text-yellow-800';
      case 'revision':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Documentos del Comité</h2>
        <p className="text-sm text-gray-500">Visualiza y descarga tus actas y reportes.</p>
      </div>

      {/* Mensajes de error */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <>
        {/* Actas */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Actas ({actas.length})
              </h3>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Cargando actas...
              </div>
            ) : actas.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No hay actas disponibles para este comité.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Número
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Contenido
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Elaborada por
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {actas.map((acta) => (
                      <tr key={acta.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {acta.numero_acta || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div className="max-w-xs truncate">
                            {acta.contenido || 'Sin contenido'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(acta.fecha_elaboracion)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getEstadoBadgeClass(acta.estado)}`}>
                            {acta.estado || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {acta.elaborada_por_username || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="text-xs text-gray-400">Sin adjunto</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        {/* Reportes */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Reportes ({reportes.length})
              </h3>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Cargando reportes...
              </div>
            ) : reportes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No hay reportes disponibles para este comité.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Título
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Contenido
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Elaborado por
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportes.map((reporte) => (
                      <tr key={reporte.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {reporte.titulo || 'Sin título'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {reporte.tipo_informe || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div className="max-w-xs truncate">
                            {reporte.contenido || 'Sin contenido'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(reporte.fecha_elaboracion)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getEstadoBadgeClass(reporte.estado)}`}>
                            {reporte.estado || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {reporte.elaborado_por_username || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {reporte.archivo_adjunto && (
                            <button
                              onClick={() => handleDownload(reporte.archivo_adjunto, `reporte_${reporte.id}.pdf`)}
                              className="text-indigo-600 hover:text-indigo-900 font-medium"
                            >
                              Descargar
                            </button>
                          )}
                          {!reporte.archivo_adjunto && (
                            <span className="text-xs text-gray-400">Sin adjunto</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
      </>
    </div>
  );
}
