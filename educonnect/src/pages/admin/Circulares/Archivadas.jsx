import { useEffect, useState } from 'react';
import { useCirculares } from './hooks/useCirculares';
import {
  PageHeader,
  SearchFilter,
  DataTable,
  ConfirmModal,
  StatusBadge,
} from '../../../components/ui';

export default function CircularesArchivadas() {
  const {
    cargarCirculares,
    circularesExistentes,
    loading,
    uploading,
    actualizarCircular,
  } = useCirculares();

  const [searchValue, setSearchValue] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    circular: null,
    action: null,
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    cargarCirculares();
  }, [cargarCirculares]);

  const circularesArchivadas = circularesExistentes.filter(
    (circular) => circular.estado === 'Archivado'
  );

  const filteredCirculares = circularesArchivadas.filter((circular) =>
    circular.titulo.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleOpenConfirm = (circular, action) => {
    setConfirmModal({ open: true, circular, action });
  };

  const handleConfirmAction = async () => {
    const { circular, action } = confirmModal;
    try {
      if (action === 'restore') {
        await actualizarCircular({ estado: 'Publicado' }, circular.id, null);
        setSuccessMessage('Circular desarchivada con éxito');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      const payload = error?.details;
      if (payload && typeof payload === 'object') {
        const [field, value] = Object.entries(payload)[0] || [];
        if (field && value) {
          setErrorMessage(`${field}: ${Array.isArray(value) ? value[0] : value}`);
        } else {
          setErrorMessage('No fue posible desarchivar la circular');
        }
      } else {
        setErrorMessage(error?.message || 'No fue posible desarchivar la circular');
      }
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setConfirmModal({ open: false, circular: null, action: null });
    }
  };

  const tableColumns = [
    {
      key: 'titulo',
      label: 'Título',
      render: (row) => <div className="font-medium text-slate-900">{row.titulo}</div>,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (row) => <StatusBadge status={row.estado} size="sm" />,
    },
    {
      key: 'fecha_vigencia_inicio',
      label: 'Fecha de Publicación',
      render: (row) => (
        <span className="text-slate-600">{row.fecha_vigencia_inicio || 'Inmediata'}</span>
      ),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (row) => (
        <button
          onClick={() => handleOpenConfirm(row, 'restore')}
          className="rounded-md bg-[#0f6e56] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#085041]"
        >
          Desarchivar
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Circulares Archivadas" />

      <SearchFilter
        value={searchValue}
        onChange={setSearchValue}
        placeholder="Buscar por título..."
      />

      <DataTable
        columns={tableColumns}
        data={filteredCirculares}
        loading={loading}
        emptyMessage="No hay circulares archivadas"
      />

      <ConfirmModal
        open={confirmModal.open}
        title="Desarchivar Circular"
        message="La circular volverá a la vista principal de circulares activas."
        variant="info"
        confirmLabel="Desarchivar"
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal({ open: false, circular: null, action: null })}
        loading={uploading}
      />

      {successMessage && (
        <div className="fixed bottom-4 right-4 z-[1300] rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-4 left-4 z-[1300] rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
