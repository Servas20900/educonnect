import { useState, useEffect } from 'react';
import {
  fetchAuditoriaLogs,
  fetchReporteUsoSistema,
  fetchReportePorModulo,
  fetchReporteErrores
} from '../../api/reportesService';

export default function Reportes() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [reporteUso, setReporteUso] = useState([]);
  const [reporteModulo, setReporteModulo] = useState([]);
  const [reporteErrores, setReporteErrores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filtros
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('');
  const [filtroResultado, setFiltroResultado] = useState('');
  
  // Tab activo
  const [tabActivo, setTabActivo] = useState('auditoria');

  // Cargar logs de auditoría
  const cargarAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const datos = await fetchAuditoriaLogs({
        fecha_inicio: filtroFecha ? `${filtroFecha}T00:00:00` : '',
        resultado: filtroResultado
      });
      setAuditLogs(Array.isArray(datos) ? datos : datos.results || []);
    } catch (err) {
      setError(err.message || 'Error al cargar logs de auditoría');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar reportes
  const cargarReportes = async () => {
    setLoading(true);
    setError(null);
    try {
      const [uso, modulo, errores] = await Promise.all([
        fetchReporteUsoSistema(),
        fetchReportePorModulo(),
        fetchReporteErrores()
      ]);
      setReporteUso(Array.isArray(uso) ? uso : []);
      setReporteModulo(Array.isArray(modulo) ? modulo : []);
      setReporteErrores(Array.isArray(errores) ? errores : errores.results || []);
    } catch (err) {
      setError(err.message || 'Error al cargar reportes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar componente
  useEffect(() => {
    cargarAuditLogs();
    cargarReportes();
  }, []);

  // Aplicar filtros
  const aplicarFiltros = () => {
    cargarAuditLogs();
  };

  // Filtrar logs localmente por usuario o módulo
  const logsFiltratos = auditLogs.filter(log => {
    const cumpleFiltroUsuario = !filtroUsuario || 
      log.usuario_email?.toLowerCase().includes(filtroUsuario.toLowerCase()) ||
      log.usuario_nombre?.toLowerCase().includes(filtroUsuario.toLowerCase());
    
    const cumpleFiltroModulo = !filtroModulo || 
      log.modulo?.toLowerCase().includes(filtroModulo.toLowerCase());
    
    return cumpleFiltroUsuario && cumpleFiltroModulo;
  });

  // Exportar datos a CSV
  const exportarCSV = (datos, nombre) => {
    const headers = Object.keys(datos[0] || {});
    const csv = [
      headers.join(','),
      ...datos.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombre}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-2">
        Módulo de Reportes y Auditoría
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Tabs de navegación */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTabActivo('auditoria')}
          className={`pb-2 px-4 font-medium transition ${
            tabActivo === 'auditoria'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Logs de Auditoría
        </button>
        <button
          onClick={() => setTabActivo('reportes')}
          className={`pb-2 px-4 font-medium transition ${
            tabActivo === 'reportes'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Reportes de Uso
        </button>
      </div>

      {/* TAB: Logs de Auditoría */}
      {tabActivo === 'auditoria' && (
        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Logs de Auditoría y Trazabilidad (RF-036)
          </h2>

          <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-sm"
            />
            <input
              type="text"
              placeholder="Filtrar por usuario..."
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-sm"
            />
            <input
              type="text"
              placeholder="Filtrar por módulo..."
              value={filtroModulo}
              onChange={(e) => setFiltroModulo(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-sm"
            />
            <select
              value={filtroResultado}
              onChange={(e) => setFiltroResultado(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-sm"
            >
              <option value="">Todos los resultados</option>
              <option value="Exitoso">Exitoso</option>
              <option value="Error">Error</option>
            </select>
          </div>

          <div className="mb-4 flex gap-2">
            <button
              onClick={aplicarFiltros}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Aplicar Filtros'}
            </button>
            <button
              onClick={() => exportarCSV(logsFiltratos, 'auditoria_logs')}
              disabled={logsFiltratos.length === 0}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              Exportar a CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Módulo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resultado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logsFiltratos.length > 0 ? (
                  logsFiltratos.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.fecha_hora).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {log.usuario_email || 'Sistema'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.modulo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.accion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.resultado === 'Exitoso'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.resultado}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No hay registros disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB: Reportes de Uso */}
      {tabActivo === 'reportes' && (
        <div>
          <section className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Reporte de Uso del Sistema (RF-010)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Actividad de usuarios en los últimos 30 días
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total de Acciones
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último Acceso
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reporteUso.length > 0 ? (
                    reporteUso.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {row.usuario__email || 'Desconocido'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row.total_acciones}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row.ultimo_acceso ? new Date(row.ultimo_acceso).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                        No hay datos disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => exportarCSV(reporteUso, 'reporte_uso_sistema')}
              disabled={reporteUso.length === 0}
              className="mt-4 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              Exportar Reporte
            </button>
          </section>

          <section className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Reporte de Actividad por Módulo
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Actividad registrada por cada módulo en los últimos 30 días
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Módulo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total de Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reporteModulo.length > 0 ? (
                    reporteModulo.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {row.modulo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row.total_acciones}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="px-6 py-4 text-center text-gray-500">
                        No hay datos disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => exportarCSV(reporteModulo, 'reporte_por_modulo')}
              disabled={reporteModulo.length === 0}
              className="mt-4 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              Exportar Reporte
            </button>
          </section>

          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Reporte de Errores del Sistema
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Últimos errores registrados en los últimos 30 días
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Módulo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reporteErrores.length > 0 ? (
                    reporteErrores.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(log.fecha_hora).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {log.usuario_email || 'Sistema'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.modulo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {log.accion}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                        No hay errores registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => exportarCSV(reporteErrores, 'reporte_errores')}
              disabled={reporteErrores.length === 0}
              className="mt-4 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              Exportar Reporte
            </button>
          </section>
        </div>
      )}
    </div>
  );
};