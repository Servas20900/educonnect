import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchGruposDocente } from '../../../api/registroEstudiantesService';
import { exportarPlanilla } from '../../../api/evaluacionesService';

const DOCENTE_GRUPO_STORAGE_KEY = 'docente_academico_hub_grupo_id';

export default function Exportar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryGrupoId = searchParams.get('grupo');

  const [grupoId, setGrupoId] = useState('');
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const loadGrupos = async () => {
    try {
      const data = await fetchGruposDocente();
      const list = Array.isArray(data) ? data : data.results || [];
      setGrupos(list);

      const persistedGrupoId = localStorage.getItem(DOCENTE_GRUPO_STORAGE_KEY);

      if (queryGrupoId && list.some((item) => String(item.id) === String(queryGrupoId))) {
        setGrupoId(String(queryGrupoId));
        return;
      }

      if (persistedGrupoId && list.some((item) => String(item.id) === String(persistedGrupoId))) {
        setGrupoId(String(persistedGrupoId));
        return;
      }

      if (list.length > 0) {
        setGrupoId(String(list[0].id));
      } else {
        setGrupoId('');
      }
    } catch {
      setError('No se pudieron cargar los grupos del docente.');
      setGrupos([]);
      setGrupoId('');
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
    localStorage.setItem(DOCENTE_GRUPO_STORAGE_KEY, String(grupoId));
  }, [grupoId]);

  const handleExportar = async () => {
    if (!grupoId) {
      setMensaje('Debes seleccionar un grupo primero.');
      return;
    }

    setLoading(true);
    setError('');
    setMensaje('');

    try {
      const blob = await exportarPlanilla(grupoId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const grupoNombre = grupos.find((g) => String(g.id) === String(grupoId))?.nombre || 'grupo';
      link.setAttribute('download', `planilla_notas_${grupoNombre}_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMensaje('Planilla descargada correctamente.');
    } catch {
      setError('No se pudo descargar la planilla. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVolver = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/docente/estudiantes');
  };

  return (
    <div className="space-y-6 p-8 bg-gray-50 min-h-screen">
      <div>
        <button
          onClick={handleVolver}
          className="mb-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Volver
        </button>
        <h2 className="text-2xl font-bold">Exportar Planilla de Notas</h2>
        <p className="text-sm text-gray-500">
          Descarga la planilla de notas en formato Excel.
        </p>
      </div>

      {mensaje && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="max-w-md">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Selecciona un grupo</label>
          <select
            value={grupoId}
            onChange={(e) => setGrupoId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-6"
          >
            <option value="">Seleccionar grupo</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label || `${g.nombre} (${g.codigo_grupo || g.id})`}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportar}
            disabled={!grupoId || loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Descargando...' : 'Descargar Planilla'}
          </button>

          <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-600 font-medium mb-2">Información:</p>
            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li>La planilla incluye todas las evaluaciones y calificaciones del grupo</li>
              <li>Se descargará en formato Excel para fácil manipulación</li>
              <li>Asegúrate de seleccionar el grupo correcto antes de descargar</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
