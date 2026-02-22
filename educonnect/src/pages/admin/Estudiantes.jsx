import { useEffect, useMemo, useState } from 'react';
import { fetchEstudiantes } from '../../api/estudiantesService';

export default function Estudiantes() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadEstudiantes = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchEstudiantes();
      const list = Array.isArray(data) ? data : data.results || [];
      setEstudiantes(list);
    } catch (err) {
      setError('No se pudieron cargar los estudiantes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEstudiantes();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return estudiantes;
    const term = search.trim().toLowerCase();
    return estudiantes.filter((item) => {
      const persona = item.persona_info || {};
      const nombre = `${persona.nombre || ''} ${persona.primer_apellido || ''} ${persona.segundo_apellido || ''}`.toLowerCase();
      const codigo = (item.codigo_estudiante || '').toLowerCase();
      const identificacion = (persona.identificacion || '').toLowerCase();
      return nombre.includes(term) || codigo.includes(term) || identificacion.includes(term);
    });
  }, [estudiantes, search]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-700">Listado de Estudiantes</h1>
          <p className="text-sm text-gray-500">Estudiantes registrados en el sistema.</p>
        </div>
        <button
          onClick={loadEstudiantes}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Recargar
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-1/2"
            placeholder="Buscar por nombre, identificacion o codigo"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Identificacion</th>
                <th className="px-3 py-2">Codigo</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan="6" className="px-3 py-6 text-center text-sm text-gray-500">
                    Cargando estudiantes...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-3 py-6 text-center text-sm text-gray-500">
                    No hay estudiantes registrados.
                  </td>
                </tr>
              )}
              {!loading && filtered.map((est) => {
                const persona = est.persona_info || {};
                const nombre = `${persona.nombre || ''} ${persona.primer_apellido || ''} ${persona.segundo_apellido || ''}`.trim();
                return (
                  <tr key={est.usuario_id || est.persona_id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{nombre || 'N/A'}</td>
                    <td className="px-3 py-2 text-gray-700">{persona.identificacion || 'N/A'}</td>
                    <td className="px-3 py-2 text-gray-700">{est.codigo_estudiante || 'N/A'}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        est.estado_estudiante === 'activo' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {est.estado_estudiante || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700">{est.tipo_estudiante || 'N/A'}</td>
                    <td className="px-3 py-2 text-gray-700">
                      {persona.email_institucional || persona.email_personal || 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
