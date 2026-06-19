import { useEffect, useMemo, useState } from 'react';
import { DataTable, PageHeader, SearchFilter } from '../../components/ui';
import { fetchHorario, descargarDocumentoHorario } from '../../api/horario';

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

      <DataTable
        loading={loading}
        data={filteredHorarios}
        emptyMessage="Aún no tenés un horario asignado por administración."
        columns={[
          {
            key: 'nombre',
            label: 'Nombre',
            render: (horario) => <span className="font-medium text-slate-900">{horario.nombre}</span>,
          },
          {
            key: 'estado',
            label: 'Estado',
            render: (horario) => <span className="text-slate-700">{horario.estado || 'Borrador'}</span>,
          },
          {
            key: 'documento',
            label: 'Documento',
            render: (horario) =>
              horario.documento_adjunto ? (
                <button
                  type="button"
                  onClick={() => descargarDocumentoHorario(horario.id, horario.documento_adjunto.nombre || `horario_${horario.id}`)}
                  className="rounded-md bg-[#185fa5] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#378add]"
                >
                  Descargar
                </button>
              ) : (
                <span className="text-gray-400">Sin documento</span>
              ),
          },
        ]}
      />
    </div>
  );
}
