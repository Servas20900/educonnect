import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardCheck, AlertTriangle, GraduationCap } from 'lucide-react';
import { PageHeader } from '../../components/ui';
import { fetchGruposDocente } from '../../api/registroEstudiantesService';

const HUB_GRUPO_STORAGE_KEY = 'docente_estudiantes_hub_grupo_id';

export default function EstudiantesHub() {
  const navigate = useNavigate();
  const [grupos, setGrupos] = useState([]);
  const [grupoId, setGrupoId] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const selectedGrupo = useMemo(
    () => grupos.find((grupo) => String(grupo.id) === String(grupoId)) || null,
    [grupos, grupoId]
  );

  const loadGrupos = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchGruposDocente();
      const list = Array.isArray(response) ? response : response?.results || [];
      setGrupos(list);

      const persistedGrupoId = localStorage.getItem(HUB_GRUPO_STORAGE_KEY);
      const persistedExists = list.some((grupo) => String(grupo.id) === String(persistedGrupoId));

      if (persistedExists) {
        setGrupoId(String(persistedGrupoId));
      } else if (list.length > 0) {
        setGrupoId(String(list[0].id));
      } else {
        setGrupoId('');
      }
    } catch {
      setError('No se pudieron cargar los grupos asignados.');
      setGrupos([]);
      setGrupoId('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrupos();
  }, []);

  useEffect(() => {
    if (grupoId) {
      localStorage.setItem(HUB_GRUPO_STORAGE_KEY, String(grupoId));
    }
  }, [grupoId]);

  const navigateTo = (basePath) => {
    if (!grupoId) return;
    navigate(`${basePath}?grupo=${grupoId}`);
  };

  const cards = [
    {
      id: 'listado',
      titulo: 'Listado de Estudiantes',
      descripcion: 'Ver y gestionar estudiantes del grupo seleccionado',
      icono: <GraduationCap className="w-16 h-16" />,
      color: 'from-[#185fa5] to-[#0b2545]',
      action: () => navigateTo('/docente/estudiantes/listado'),
    },
    {
      id: 'academico',
      titulo: 'Académico',
      descripcion: 'Gestionar evaluaciones, calificaciones y progreso del grupo',
      icono: <BookOpen className="w-16 h-16" />,
      color: 'from-[#185fa5] to-[#0b2545]',
      action: () => navigateTo('/docente/academico'),
    },
    {
      id: 'asistencia',
      titulo: 'Asistencia',
      descripcion: 'Registrar asistencia diaria y revisar histórico del grupo',
      icono: <ClipboardCheck className="w-16 h-16" />,
      color: 'from-[#185fa5] to-[#0b2545]',
      action: () => navigateTo('/docente/asistencia'),
    },
    {
      id: 'riesgo',
      titulo: 'Riesgo Académico',
      descripcion: 'Monitorear estudiantes en riesgo y su criticidad',
      icono: <AlertTriangle className="w-16 h-16" />,
      color: 'from-[#185fa5] to-[#0b2545]',
      action: () => navigateTo('/docente/riesgo'),
    },
    {
      id: 'exportaciones',
      titulo: 'Exportación de Notas',
      descripcion: 'Descargar planillas Excel de notas por grupo',
      icono: <ClipboardCheck className="w-16 h-16" />,
      color: 'from-[#185fa5] to-[#0b2545]',
      action: () => navigateTo('/docente/estudiantes/exportaciones'),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estudiantes"
        subtitle="Selecciona un grupo asignado y accede a Académico, Asistencia, Riesgo, Listado o Exportación de notas"
      />

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:max-w-md">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Grupo asignado</label>
            <select
              value={grupoId}
              onChange={(event) => setGrupoId(event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              disabled={loading || grupos.length === 0}
            >
              {grupos.length === 0 ? (
                <option value="">Sin grupos asignados</option>
              ) : (
                grupos.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>
                    {grupo.label || `${grupo.nombre} (${grupo.codigo_grupo || grupo.id})`}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            type="button"
            onClick={loadGrupos}
            className="rounded-md border border-[#185fa5] px-4 py-2 text-sm font-medium text-[#185fa5] transition-colors hover:bg-[#e6f1fb]"
          >
            Recargar grupos
          </button>
        </div>

        {selectedGrupo && (
          <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Grupo activo: <span className="font-semibold">{selectedGrupo.label || selectedGrupo.nombre}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && grupos.length === 0 && (
          <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            No tienes grupos asignados en este momento.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onMouseEnter={() => setHoveredCard(card.id)}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={card.action}
            disabled={!grupoId}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-left shadow-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 transition-opacity duration-300 group-hover:opacity-10`} />
            <div className="relative flex min-h-64 flex-col items-center justify-center p-8">
              <div className={`mb-6 text-transparent bg-clip-text bg-gradient-to-br ${card.color} transition-transform duration-300 group-hover:scale-110`}>
                {card.icono}
              </div>
              <h2
                className={`mb-3 text-center text-2xl font-bold transition-all duration-300 ${
                  hoveredCard === card.id
                    ? `text-transparent bg-clip-text bg-gradient-to-br ${card.color}`
                    : 'text-[#0b2545]'
                }`}
              >
                {card.titulo}
              </h2>
              <p className="flex-1 text-center text-sm leading-relaxed text-slate-600">{card.descripcion}</p>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color} scale-x-0 transition-transform duration-300 group-hover:scale-x-100`} />
          </button>
        ))}
      </div>
    </div>
  );
}
