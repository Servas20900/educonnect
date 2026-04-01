import { useEffect, useState } from 'react';
import { useCirculares } from "./Circulares/hooks/useCirculares";
import FormularioCircular from './Circulares/FormularioCircular';
import {
  PageHeader,
  SearchFilter,
  DataTable,
  ConfirmModal,
  StatusBadge,
} from '../../components/ui';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';

export default function CircularesList() {
  const {
    cargarCirculares,
    circularesExistentes,
    loading,
    uploading,
    crearCircular,
    actualizarCircular,
    eliminarCircular,
  } = useCirculares();

  const [formOpen, setFormOpen] = useState(false);
  const [currentCircular, setCurrentCircular] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    circular: null,
    action: null,
  });
  const [searchValue, setSearchValue] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    cargarCirculares();
  }, [cargarCirculares]);

  const circularesVisibles = circularesExistentes.filter(
    (circular) =>
      showArchived
        ? circular.estado === 'Archivado'
        : !['Inactivo', 'Archivado'].includes(circular.estado)
  );

  const filteredCirculares = circularesVisibles.filter((circular) => {
    const matchesSearch = circular.titulo
      .toLowerCase()
      .includes(searchValue.toLowerCase());
    const matchesFilter =
      showArchived || !filterEstado ? true : circular.estado === filterEstado;
    return matchesSearch && matchesFilter;
  });

  const handleNewCircular = () => {
    setCurrentCircular(null);
    setFormOpen(true);
  };

  const handleEditCircular = (circular) => {
    setCurrentCircular(circular);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setCurrentCircular(null);
  };

  const handleOpenConfirm = (circular, action) => {
    setConfirmModal({
      open: true,
      circular,
      action,
    });
  };

  const handleConfirmAction = async () => {
    const { circular, action } = confirmModal;
    try {
      if (action === 'activate') {
        await actualizarCircular({ estado: 'Publicado' }, circular.id, null);
      } else if (action === 'deactivate') {
        await actualizarCircular({ estado: 'Inactivo' }, circular.id, null);
      } else if (action === 'archive') {
        await actualizarCircular({ estado: 'Archivado' }, circular.id, null);
      } else if (action === 'restore') {
        await actualizarCircular({ estado: 'Publicado' }, circular.id, null);
      }
      setSuccessMessage('Acción realizada con éxito');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error:', error?.details || error?.message || error);
    } finally {
      setConfirmModal({ open: false, circular: null, action: null });
    }
  };

  const handleFormSubmit = async (data, archivo) => {
    try {
      if (currentCircular?.id) {
        await actualizarCircular(data, currentCircular.id, archivo);
      } else {
        await crearCircular(data, archivo);
      }
      setSuccessMessage(
        currentCircular
          ? 'Circular actualizada con éxito'
          : 'Circular creada con éxito'
      );
      handleCloseForm();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error:', error?.details || error?.message || error);
    }
  };

  const tableColumns = [
    {
      key: 'titulo',
      label: 'Título',
      render: (row) => (
        <div className="font-medium text-slate-900">{row.titulo}</div>
      ),
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
        <div className="flex justify-end gap-2">
          {row.estado === 'Archivado' ? (
            <button
              onClick={() => handleOpenConfirm(row, 'restore')}
              className="rounded-md bg-[#0f6e56] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#085041]"
            >
              Desarchivar
            </button>
          ) : row.estado === 'Inactivo' ? (
            <button
              onClick={() => handleOpenConfirm(row, 'activate')}
              className="rounded-md bg-[#0f6e56] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#085041]"
            >
              Activar
            </button>
          ) : (
            <>
              <button
                onClick={() => handleEditCircular(row)}
                className="rounded-md bg-[#185fa5] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#378add]"
              >
                Editar
              </button>
              <button
                onClick={() => handleOpenConfirm(row, 'deactivate')}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
              >
                Desactivar
              </button>
              <button
                onClick={() => handleOpenConfirm(row, 'archive')}
                className="rounded-md bg-[#0b2545] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#081a31]"
              >
                Archivar
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Circulares"
        action={{
          label: 'Nueva Circular',
          onClick: handleNewCircular,
          icon: '+',
        }}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setShowArchived((prev) => !prev);
            setFilterEstado('');
            setSearchValue('');
          }}
          className="rounded-md border border-[#185fa5] px-4 py-2 text-sm font-medium text-[#185fa5] transition-colors hover:bg-[#e6f1fb]"
        >
          {showArchived ? 'Ver circulares activas' : 'Ver circulares archivadas'}
        </button>
      </div>

      <SearchFilter
        value={searchValue}
        onChange={setSearchValue}
        placeholder="Buscar por título..."
        filters={[
          {
            key: 'estado',
            label: 'Estado:',
            options: [
              { value: 'Publicado', label: 'Publicado' },
              { value: 'Borrador', label: 'Borrador' },
            ],
          },
        ]}
        onFilterChange={({ value }) => setFilterEstado(value)}
      />

      <DataTable
        columns={tableColumns}
        data={filteredCirculares}
        loading={loading}
        emptyMessage={
          showArchived
            ? 'No hay circulares archivadas'
            : 'No hay circulares que coincidan con tu búsqueda'
        }
        emptyAction={{
          label: showArchived ? 'Volver a activas' : 'Crear nueva circular',
          onClick: showArchived
            ? () => setShowArchived(false)
            : handleNewCircular,
        }}
      />

      <Dialog
        open={formOpen}
        onClose={handleCloseForm}
        fullWidth
        maxWidth="md"
        PaperProps={{ className: 'rounded-xl' }}
      >
        <DialogTitle className="text-lg font-semibold text-[#0b2545]">
          {currentCircular ? 'Editar Circular' : 'Nueva Circular'}
        </DialogTitle>
        <DialogContent className="px-6 py-5">
          <FormularioCircular
            circular={currentCircular}
            onSuccess={handleFormSubmit}
            onCancel={handleCloseForm}
            uploading={uploading}
          />
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={confirmModal.open}
        title={
          confirmModal.action === 'activate'
            ? 'Activar Circular'
            : confirmModal.action === 'archive'
              ? 'Archivar Circular'
              : confirmModal.action === 'restore'
                ? 'Desarchivar Circular'
              : 'Desactivar Circular'
        }
        message={
          confirmModal.action === 'activate'
            ? 'Esta circular volverá a ser visible en el portal.'
            : confirmModal.action === 'archive'
              ? 'Esta circular se moverá a la vista de archivadas.'
              : confirmModal.action === 'restore'
                ? 'Esta circular volverá a la vista principal de circulares activas.'
              : 'Esta circular dejará de ser visible en el portal.'
        }
        variant={
          confirmModal.action === 'activate'
            ? 'info'
            : confirmModal.action === 'archive'
              ? 'warning'
              : confirmModal.action === 'restore'
                ? 'info'
              : 'danger'
        }
        confirmLabel={
          confirmModal.action === 'activate'
            ? 'Activar'
            : confirmModal.action === 'archive'
              ? 'Archivar'
              : confirmModal.action === 'restore'
                ? 'Desarchivar'
              : 'Desactivar'
        }
        onConfirm={handleConfirmAction}
        onCancel={() =>
          setConfirmModal({ open: false, circular: null, action: null })
        }
        loading={uploading}
      />

      {successMessage && (
        <div className="fixed bottom-4 right-4 rounded-md bg-green-50 p-4 text-sm text-green-700 border border-green-200">
          {successMessage}
        </div>
      )}
    </div>
  );
}