import { useEffect, useMemo, useState } from 'react';
import { DataTable, PageHeader, SearchFilter } from '../../../components/ui';
import {
  descargarArchivoPlaneamiento,
  fetchPlaneamientosAdmin,
} from '../../../api/planeamientos';

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

const formatErrorMessage = (error) => {
  if (!error) return 'Ocurrio un error inesperado';
  if (typeof error?.response?.data?.detail === 'string') return error.response.data.detail;
  if (typeof error?.message === 'string' && error.message.trim()) return error.message;
  return 'No fue posible completar la accion';
};

const triggerBrowserDownload = (url) => {
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('rel', 'noopener noreferrer');
  document.body.appendChild(a);
  a.click();
  a.remove();
};

export default function PlaneamientosAdminList() {
  const [planeamientos, setPlaneamientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const cargarPlaneamientos = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const result = await fetchPlaneamientosAdmin();
      setPlaneamientos(toArray(result));
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPlaneamientos();
  }, []);

  const planeamientosFiltrados = useMemo(() => {
    const q = searchValue.trim().toLowerCase();

    return planeamientos.filter((item) => {
      const titulo = (item.titulo || '').toLowerCase();
      const docente = (item.docente_nombre || '').toLowerCase();
      const detalle = (item.detalle || '').toLowerCase();
      return !q || titulo.includes(q) || docente.includes(q) || detalle.includes(q);
    });
  }, [planeamientos, searchValue]);

  const handleDescargar = async (item) => {
    if (!item?.archivo) return;

    try {
      const downloadUrl = await descargarArchivoPlaneamiento(item.id);
      triggerBrowserDownload(downloadUrl);
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const tableColumns = [
    {
      key: 'docente_nombre',
      label: 'Docente',
      render: (row) => <span className="font-medium text-slate-900">{row.docente_nombre || 'Sin docente'}</span>,
    },
    {
      key: 'titulo',
      label: 'Titulo',
      render: (row) => <span className="text-slate-700">{row.titulo || '-'}</span>,
    },
    {
      key: 'detalle',
      label: 'Detalle',
      render: (row) => <span className="text-slate-600">{row.detalle || '-'}</span>,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => handleDescargar(row)}
            className="rounded-md bg-[#185fa5] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#378add] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!row.archivo}
          >
            Descargar
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planeamientos"
        subtitle="Listado de docentes y planeamientos cargados"
      />

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <SearchFilter
        value={searchValue}
        onChange={setSearchValue}
        placeholder="Buscar por docente, titulo o detalle..."
      />

      <DataTable
        columns={tableColumns}
        data={planeamientosFiltrados}
        loading={loading}
        emptyMessage="No hay planeamientos para mostrar"
      />
    </div>
  );
}
