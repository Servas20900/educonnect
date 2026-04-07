import { useEffect, useRef, useState } from 'react';
import { useHorarios } from './hooks/useHorarios';
import FormularioHorario from './FormularioHorario';
import {
  PageHeader,
  ActiveArchiveToggle,
  SearchFilter,
  DataTable,
  ConfirmModal,
  FormModal,
} from '../../../components/ui';

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

export default function HorariosList() {
  const formRef = useRef(null);

  const {
    cargarHorarios,
    cargarUsuarios,
    horariosExistentes,
    loading,
    uploading,
    usuarios,
    loadingUsuarios,
    crearHorario,
    actualizarHorario,
    archivarHorario,
    subirDocumentoHorario,
  } = useHorarios();

  const [formOpen, setFormOpen] = useState(false);
  const [currentHorario, setCurrentHorario] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    horario: null,
  });
  const [searchValue, setSearchValue] = useState('');
  const [viewMode, setViewMode] = useState('activos');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    cargarHorarios({ include_archivados: true });
    cargarUsuarios();
  }, []);

  const horariosActivos = horariosExistentes.filter((horario) => horario.estado !== 'Archivado');
  const horariosArchivados = horariosExistentes.filter((horario) => horario.estado === 'Archivado');
  const horariosEnVista = viewMode === 'archivados' ? horariosArchivados : horariosActivos;

  const filteredHorarios = horariosEnVista.filter((horario) => {
    const matchesSearch =
      horario.nombre?.toLowerCase().includes(searchValue.toLowerCase()) ||
      horario.docente_info?.nombre?.toLowerCase().includes(searchValue.toLowerCase());
    return matchesSearch;
  });

  const handleNewHorario = () => {
    setCurrentHorario(null);
    setFormOpen(true);
  };

  const handleEditHorario = (horario) => {
    setCurrentHorario(horario);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setCurrentHorario(null);
  };

  const handleOpenConfirm = (horario, event) => {
    if (event?.currentTarget?.blur) {
      event.currentTarget.blur();
    }
    setConfirmModal({
      open: true,
      horario,
    });
  };

  const handleConfirmAction = async () => {
    const { horario } = confirmModal;
    try {
      await archivarHorario(horario.id);
      setSuccessMessage('Horario archivado con éxito');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setConfirmModal({ open: false, horario: null });
    }
  };

  const handleFormSubmit = async (data, archivo) => {
    try {
      let resultado = null;
      if (currentHorario?.id) {
        resultado = await actualizarHorario(data, currentHorario.id, null);
      } else {
        resultado = await crearHorario(data, null);
      }

      const horarioId = resultado?.sendingData?.id || currentHorario?.id;
      if (archivo && horarioId) {
        await subirDocumentoHorario(
          horarioId,
          archivo,
          `Horario ${data?.nombre || ''}`.trim()
        );
      }

      setSuccessMessage(
        currentHorario
          ? 'Horario actualizado con éxito'
          : 'Horario creado con éxito'
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
      key: 'nombre',
      label: 'Nombre del Horario',
      render: (row) => (
        <div className="font-medium text-slate-900">{row.nombre}</div>
      ),
    },
    {
      key: 'docente',
      label: 'Docente Asignado',
      render: (row) => (
        <span className="text-slate-600">
          {row.docente_info?.nombre || 'No asignado'}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (row) => (
        <span className="text-slate-600">{row.estado || 'Borrador'}</span>
      ),
    },
    {
      key: 'documento',
      label: 'Documento',
      render: (row) => {
        const documento = row.documento_adjunto;
        if (!documento?.url_descarga) {
          return <span className="text-gray-400">Sin documento</span>;
        }

        return (
          <a
            href={documento.url_descarga}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#185fa5] hover:underline text-sm"
          >
            Descargar
          </a>
        );
      },
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleEditHorario(row)}
            className="rounded-md bg-[#185fa5] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#378add]"
          >
            Editar
          </button>
          <button
            onClick={(event) => handleOpenConfirm(row, event)}
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
        title="Horarios"
        subtitle="Sube y asigna horarios a docentes"
        action={{
          label: 'Nuevo Horario',
          onClick: handleNewHorario,
          icon: '+',
        }}
      />

      <ActiveArchiveToggle
        viewMode={viewMode}
        onChange={setViewMode}
        activeLabel="Activos"
        archivedLabel="Archivados"
        activeCount={horariosActivos.length}
        archivedCount={horariosArchivados.length}
      />

      <SearchFilter
        value={searchValue}
        onChange={setSearchValue}
        placeholder="Buscar por nombre o docente..."
      />

      <DataTable
        columns={tableColumns}
        data={filteredHorarios}
        loading={loading}
        emptyMessage="No hay horarios cargados"
        emptyAction={{
          label: 'Crear nuevo horario',
          onClick: handleNewHorario,
        }}
      />

      <FormModal
        open={formOpen}
        onClose={handleCloseForm}
        onSubmit={handleModalSubmit}
        title={currentHorario ? 'Editar Horario' : 'Nuevo Horario'}
        submitLabel={uploading ? 'Procesando...' : currentHorario ? 'Actualizar Horario' : 'Subir Horario'}
        loading={uploading}
        maxWidth="md"
      >
        <FormularioHorario
          ref={formRef}
          horario={currentHorario}
          onSubmitHorario={handleFormSubmit}
          uploading={uploading}
          usuarios={usuarios}
          loadingUsuarios={loadingUsuarios}
        />
      </FormModal>

      <ConfirmModal
        open={confirmModal.open}
        title="Archivar Horario"
        message="Este horario se moverá a la vista de archivados."
        variant="warning"
        confirmLabel="Archivar"
        onConfirm={handleConfirmAction}
        onCancel={() =>
          setConfirmModal({ open: false, horario: null })
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