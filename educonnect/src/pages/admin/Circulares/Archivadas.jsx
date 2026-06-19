import { useEffect, useState } from 'react';
import { useCirculares } from './hooks/useCirculares';
import { useNavigate } from 'react-router-dom';
import useToast from '../../../hooks/useToast';
import {
  PageHeader,
  SearchFilter,
  DataTable,
  ConfirmModal,
  StatusBadge,
  BtnRestaurar,
} from '../../../components/ui';

export default function CircularesArchivadas() {
  const {
    cargarCirculares,
    circularesExistentes,
    loading,
    uploading,
    restaurarCircular,
  } = useCirculares();

  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    circular: null,
    action: null,
  });
  const { toast, showSuccess, showError, clearToast } = useToast();

  useEffect(() => {
    cargarCirculares();
  }, [cargarCirculares]);

  const circularesArchivadas = circularesExistentes.filter(
    (circular) => circular.estado === 'archivada'
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
        await restaurarCircular(circular.id);
        showSuccess('Circular desarchivada con éxito');
      }
    } catch (error) {
      const payload = error?.details;
      if (payload && typeof payload === 'object') {
        const [field, value] = Object.entries(payload)[0] || [];
        showError(field && value ? `${field}: ${Array.isArray(value) ? value[0] : value}` : 'No fue posible desarchivar la circular');
      } else {
        showError(error?.message || 'No fue posible desarchivar la circular');
      }
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
        <BtnRestaurar onClick={() => handleOpenConfirm(row, 'restore')} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Circulares Archivadas" />
      
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => navigate('/circulares')}
          className="rounded-md border border-[#185fa5] px-4 py-2 text-sm font-medium text-[#185fa5] transition-colors hover:bg-[#e6f1fb]"
        >
          Ver circulares sin archivar
        </button>
      </div>

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

      <Toast message={toast?.message} variant={toast?.variant} onClose={clearToast} />
    </div>
  );
}
