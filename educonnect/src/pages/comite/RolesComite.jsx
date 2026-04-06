import { useEffect, useMemo, useState } from 'react';
import { fetchComites, fetchMiembrosConRoles } from '../../api/comitesService';
import { DataTable, PageHeader, StatusBadge } from '../../components/ui';
import useSystemConfig from '../../hooks/useSystemConfig';

export default function RolesComite() {
  const { getCatalog } = useSystemConfig();

  const [comites, setComites] = useState([]);
  const [selectedComite, setSelectedComite] = useState('');
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchValue, setSearchValue] = useState('');

  // Cargar comités disponibles al montar el componente
  useEffect(() => {
    loadComites();
  }, []);

  // Cargar miembros cuando se selecciona un comité
  useEffect(() => {
    if (selectedComite) {
      loadMiembros();
    }
  }, [selectedComite]);

  useEffect(() => {
    if (!selectedComite && comites.length > 0) {
      setSelectedComite(comites[0].id);
    }
  }, [comites, selectedComite]);

  const loadComites = async () => {
    try {
      setLoading(true);
      const data = await fetchComites({ estado: 'activo', mis_comites: true });
      setComites(data.results || data);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadMiembros = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchMiembrosConRoles(selectedComite);
      setMiembros(data);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const parseError = (err) => {
    if (typeof err === 'string') return err;
    if (err.detail) return err.detail;
    if (err.error) return err.error;
    if (err.non_field_errors) return err.non_field_errors[0];
    if (err.cargo) return err.cargo[0];
    return 'Ocurrió un error. Por favor intenta de nuevo.';
  };

  const comitesFiltrados = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return comites;
    return comites.filter((comite) => {
      return [comite.nombre, comite.descripcion, comite.tipo_comite].some((value) =>
        String(value || '').toLowerCase().includes(query)
      );
    });
  }, [comites, searchValue]);

  const miembrosTabla = useMemo(() => {
    return miembros.map((miembro) => ({
      ...miembro,
      integrante: miembro.persona_info?.nombre_completo || 'N/A',
      correo: miembro.persona_info?.email_institucional || miembro.persona_info?.email_personal || 'N/A',
    }));
  }, [miembros]);

  const columnasMiembros = [
    {
      key: 'integrante',
      label: 'Integrante',
      render: (row) => <span className="font-medium text-slate-900">{row.integrante}</span>,
    },
    {
      key: 'correo',
      label: 'Correo',
      render: (row) => <span className="text-slate-600">{row.correo}</span>,
    },
    {
      key: 'cargo',
      label: 'Rol',
      render: (row) => <StatusBadge status={row.cargo || 'Miembro'} size="sm" />,
    },
    {
      key: 'activo',
      label: 'Estado',
      render: (row) => <StatusBadge status={row.activo ? 'Activo' : 'Inactivo'} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Integrantes de comités"
        subtitle="Vista de consulta para comités asignados: integrantes, correos y roles internos"
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_2fr] md:items-end">
          <label className="space-y-1 text-sm">
            <span className="block font-medium text-slate-700">Comité</span>
            <select
              value={selectedComite}
              onChange={(event) => setSelectedComite(event.target.value)}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
              disabled={loading}
            >
              <option value="">Selecciona un comité</option>
              {comitesFiltrados.map((comite) => (
                <option key={comite.id} value={comite.id}>
                  {comite.nombre} - {comite.tipo_comite}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="block font-medium text-slate-700">Buscar comité</span>
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Filtrar por nombre o tipo"
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
            />
          </label>
        </div>
      </div>

      {selectedComite ? (
        <DataTable
          columns={columnasMiembros}
          data={miembrosTabla}
          loading={loading}
          emptyMessage="No hay integrantes activos en este comité"
        />
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No tienes comités asignados para revisar.
        </div>
      )}

      {selectedComite && miembros.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Los roles se asignan desde administración. Esta vista solo expone la composición vigente del comité.
        </div>
      ) : null}
    </div>
  );
}
