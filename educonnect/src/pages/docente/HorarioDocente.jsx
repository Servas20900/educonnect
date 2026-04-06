import { useEffect, useMemo, useState } from 'react';
import { EmptyState, PageHeader, SearchFilter } from '../../components/ui';
import { fetchHorario } from '../../api/horario';

export default function HorarioDocente() {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const cargarHorarios = async () => {
      try {
        setLoading(true);
        const data = await fetchHorario();
        setHorarios(Array.isArray(data) ? data : []);
      } catch (error) {
        setHorarios([]);
      } finally {
        setLoading(false);
      }
    };

    cargarHorarios();
  }, []);

  const filteredHorarios = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) return horarios;

    return horarios.filter((horario) => {
      const nombre = String(horario?.nombre || '').toLowerCase();
      const docente = String(horario?.docente_info?.nombre || '').toLowerCase();
      return nombre.includes(normalizedSearch) || docente.includes(normalizedSearch);
    });
  }, [horarios, searchValue]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi Horario"
        subtitle="Consulta y descarga únicamente el horario que te asignó administración"
      />

      <SearchFilter
        value={searchValue}
        onChange={setSearchValue}
        placeholder="Buscar horario..."
      />

      {!loading && filteredHorarios.length === 0 ? (
        <EmptyState
          title="Sin horarios asignados"
          message="Aún no tenés un horario asignado por administración."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Documento
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {loading
                ? Array.from({ length: 2 }).map((_, rowIndex) => (
                    <tr key={`skeleton-row-${rowIndex}`}>
                      {Array.from({ length: 3 }).map((__, columnIndex) => (
                        <td key={`skeleton-${rowIndex}-${columnIndex}`} className="px-4 py-3">
                          <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filteredHorarios.map((horario) => (
                    <tr key={horario.id} className="transition-colors hover:bg-[#e6f1fb]">
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <div className="font-medium text-slate-900">{horario.nombre}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {horario.estado || 'Borrador'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {horario.documento_adjunto?.url_descarga ? (
                          <a
                            href={horario.documento_adjunto.url_descarga}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md bg-[#185fa5] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#378add]"
                          >
                            Descargar
                          </a>
                        ) : (
                          <span className="text-gray-400">Sin documento</span>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
