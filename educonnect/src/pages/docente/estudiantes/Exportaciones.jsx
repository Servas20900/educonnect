import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../../components/ui';
import { fetchGruposDocente } from '../../../api/registroEstudiantesService';
import { exportarPlanilla } from '../../../api/evaluacionesService';

const HUB_GRUPO_STORAGE_KEY = 'docente_estudiantes_hub_grupo_id';

const normalizeName = (value) => String(value || '').trim().replace(/\s+/g, '_');

export default function Exportaciones() {
  const [searchParams] = useSearchParams();
  const queryGrupoId = searchParams.get('grupo');

  const [grupos, setGrupos] = useState([]);
  const [grupoId, setGrupoId] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [search, setSearch] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const loadGrupos = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchGruposDocente();
      const list = Array.isArray(response) ? response : response?.results || [];
      setGrupos(list);

      const persistedGrupoId = localStorage.getItem(HUB_GRUPO_STORAGE_KEY);
      const queryExists = queryGrupoId && list.some((item) => String(item.id) === String(queryGrupoId));
      const persistedExists = persistedGrupoId && list.some((item) => String(item.id) === String(persistedGrupoId));

      if (queryExists) {
        setGrupoId(String(queryGrupoId));
      } else if (persistedExists) {
        setGrupoId(String(persistedGrupoId));
      } else if (list.length > 0) {
        setGrupoId(String(list[0].id));
      } else {
        setGrupoId('');
      }
    } catch {
      setGrupos([]);
      setGrupoId('');
      setError('No se pudieron cargar los grupos del docente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrupos();
  }, []);

  useEffect(() => {
    if (!queryGrupoId) return;
    if (!grupos.some((item) => String(item.id) === String(queryGrupoId))) return;
    setGrupoId(String(queryGrupoId));
  }, [queryGrupoId, grupos]);

  useEffect(() => {
    if (!grupoId) return;
    localStorage.setItem(HUB_GRUPO_STORAGE_KEY, String(grupoId));
  }, [grupoId]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return grupos;
    const term = search.trim().toLowerCase();
    return grupos.filter((grupo) => {
      const nombre = (grupo.nombre || '').toLowerCase();
      const codigo = (grupo.codigo_grupo || '').toLowerCase();
      const label = (grupo.label || '').toLowerCase();
      return nombre.includes(term) || codigo.includes(term) || label.includes(term);
    });
  }, [grupos, search]);

  const handleDescargar = async (grupo) => {
    if (!grupo?.id) return;

    setDownloading(true);
    setMensaje('');
    setError('');

    try {
      const blob = await exportarPlanilla(grupo.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const baseName = normalizeName(grupo.label || `${grupo.nombre} ${grupo.codigo_grupo || ''}`);
      link.setAttribute('download', `notas_${baseName}_${Date.now()}.xlsx`);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMensaje(`Planilla descargada para ${grupo.label || grupo.nombre}.`);
    } catch (downloadError) {
      const detail = downloadError?.response?.data?.detail || downloadError?.message || 'No se pudo descargar la planilla.';
      setError(detail);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exportación de Notas"
        subtitle="Selecciona un grupo y descarga la planilla Excel con sus notas."
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={loadGrupos}
          className="rounded-lg border border-[#185fa5] px-3 py-2 text-sm font-medium text-[#185fa5] hover:bg-[#e6f1fb]"
        >
          Recargar grupos
        </button>
      </div>

      {mensaje && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:max-w-md">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Buscar grupo</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              placeholder="Nombre, código o etiqueta"
            />
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {grupoId ? 'Grupo seleccionado listo para exportar.' : 'No hay grupo seleccionado.'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Grupo</th>
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-3 py-8 text-center text-slate-500">
                    Cargando grupos...
                  </td>
                </tr>
              ) : filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-3 py-8 text-center text-slate-500">
                    No hay grupos para mostrar.
                  </td>
                </tr>
              ) : (
                filteredGroups.map((grupo) => (
                  <tr key={grupo.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {grupo.label || grupo.nombre}
                    </td>
                    <td className="px-3 py-3 text-slate-700">{grupo.codigo_grupo || '—'}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => handleDescargar(grupo)}
                        disabled={downloading}
                        className="rounded-md bg-[#185fa5] px-3 py-2 text-xs font-semibold text-white hover:bg-[#378add] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Descargar Excel
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-500">
          La descarga genera un archivo XLSX con las calificaciones y promedios del grupo.
        </p>
      </div>
    </div>
  );
}
