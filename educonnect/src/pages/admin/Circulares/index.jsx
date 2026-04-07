import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, Archive, RotateCcw, Search, AlertCircle } from 'lucide-react';
import { useCirculares } from './hooks/useCirculares';
import FormularioCircular from './FormularioCircular';
import {
  PageHeader,
  ActiveArchiveToggle,
  SearchFilter,
  DataTable,
  ConfirmModal,
  FormModal,
  StatusBadge,
} from '../../../components/ui';
import useSystemConfig from '../../../hooks/useSystemConfig';

const formatErrorMessage = (error) => {
  if (!error) return 'Ocurrió un error inesperado';

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  if (typeof error?.detail === 'string' && error.detail.trim()) {
    return error.detail;
  }

  if (error?.details && typeof error.details === 'object') {
    const firstEntry = Object.entries(error.details)[0];
    if (firstEntry) {
      const [field, value] = firstEntry;
      if (Array.isArray(value) && value.length > 0) {
        return `${field}: ${value[0]}`;
      }
      if (typeof value === 'string') {
        return `${field}: ${value}`;
      }
    }
  }

  return 'No fue posible completar la acción';
};

export default function CircularesList() {
  const formRef = useRef(null);

  const {
    cargarCirculares,
    circularesExistentes,
    loading,
    uploading,
    crearCircular,
    actualizarCircular,
  } = useCirculares();

  const [formOpen, setFormOpen] = useState(false);
  const [currentCircular, setCurrentCircular] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    circular: null,
  });
  const [searchValue, setSearchValue] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [viewMode, setViewMode] = useState('activos');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { getCatalog } = useSystemConfig();
  const circularStates = getCatalog('circulares_estados', [
    { value: 'Publicado', label: 'Publicado' },
    { value: 'Borrador', label: 'Borrador' },
  ]);

  useEffect(() => {
    cargarCirculares();
  }, [cargarCirculares]);

  const circularesActivas = circularesExistentes.filter(
    (circular) => !['Inactivo', 'Archivado'].includes(circular.estado)
  );

  const circularesArchivadas = circularesExistentes.filter(
    (circular) => ['Inactivo', 'Archivado'].includes(circular.estado)
  );

  const circularesVisibles = viewMode === 'archivados' ? circularesArchivadas : circularesActivas;

  const filteredCirculares = circularesVisibles.filter((circular) => {
    const matchesSearch = circular.titulo
      .toLowerCase()
      .includes(searchValue.toLowerCase());
    const matchesFilter =
      !filterEstado ? true : circular.estado === filterEstado;
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

  const handleOpenConfirm = (circular) => {
    setConfirmModal({
      open: true,
      circular,
    });
  };

  const handleConfirmAction = async () => {
    const { circular } = confirmModal;
    try {
      await actualizarCircular({ estado: 'Archivado' }, circular.id, null);
      setSuccessMessage('Circular archivada con éxito');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setConfirmModal({ open: false, circular: null });
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
      setErrorMessage(formatErrorMessage(error));
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleModalSubmit = async (event) => {
    event.preventDefault();
    if (formRef.current?.submit) {
      await formRef.current.submit();
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
          <button
            onClick={() => handleEditCircular(row)}
            className="rounded-md bg-[#185fa5] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#378add]"
          >
            Editar
          </button>
          <button
            onClick={() => handleOpenConfirm(row)}
            className="rounded-md bg-[#0b2545] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#081a31]"
          >
            Archivar
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Circulares"
        subtitle="Gestiona las circulares activas para docentes y otros destinatarios"
        action={{
          label: 'Nueva Circular',
          onClick: handleNewCircular,
          icon: '+',
        }}
      />

      <ActiveArchiveToggle
        viewMode={viewMode}
        onChange={setViewMode}
        activeLabel="Activas"
        archivedLabel="Archivadas"
        activeCount={circularesActivas.length}
        archivedCount={circularesArchivadas.length}
      />

      <SearchFilter
        value={searchValue}
        onChange={setSearchValue}
        placeholder="Buscar por título..."
        filters={[
          {
            key: 'estado',
            label: 'Estado:',
            options: circularStates,
          },
        ]}
        onFilterChange={({ value }) => setFilterEstado(value)}
      />

      <DataTable
        columns={tableColumns}
        data={filteredCirculares}
        loading={loading}
        emptyMessage="No hay circulares que coincidan con tu búsqueda"
        emptyAction={{
          label: 'Crear nueva circular',
          onClick: handleNewCircular,
        }}
      />

      <FormModal
        open={formOpen}
        onClose={handleCloseForm}
        onSubmit={handleModalSubmit}
        title={currentCircular ? 'Editar Circular' : 'Nueva Circular'}
        submitLabel={uploading ? 'Procesando...' : currentCircular ? 'Actualizar Circular' : 'Publicar Circular'}
        loading={uploading}
        maxWidth="md"
      >
        <FormularioCircular
          ref={formRef}
          circular={currentCircular}
          onSubmitCircular={handleFormSubmit}
          uploading={uploading}
        />
      </FormModal>

      <ConfirmModal
        open={confirmModal.open}
        title="Archivar Circular"
        message="Esta circular se moverá a la vista de archivadas."
        variant="warning"
        confirmLabel="Archivar"
        onConfirm={handleConfirmAction}
        onCancel={() =>
          setConfirmModal({ open: false, circular: null })
        }
        loading={uploading}
      />

      {successMessage && (
        <div className="fixed bottom-4 right-4 z-[1300] rounded-md bg-green-50 p-4 text-sm text-green-700 border border-green-200">
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
