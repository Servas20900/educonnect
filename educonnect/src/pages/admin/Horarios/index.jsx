import { useEffect, useRef, useState } from 'react';
import { descargarDocumentoHorario } from '../../../api/horario';
import { useHorarios } from './hooks/useHorarios';
import FormularioHorario from './FormularioHorario';
import {
  PageHeader,
  ActiveArchiveToggle,
  SearchFilter,
  DataTable,
  ConfirmModal,
  FormModal,
  BtnEditar,
  BtnArchivar,
  BtnRestaurar,
  Toast,
} from '../../../components/ui';
import useToast from '../../../hooks/useToast';

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
    desarchivarHorario,
    subirDocumentoHorario,
  } = useHorarios();

  const [formOpen, setFormOpen] = useState(false);
  const [currentHorario, setCurrentHorario] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    horario: null,
    accion: 'archivar',
  });
  const [searchValue, setSearchValue] = useState('');
  const [viewMode, setViewMode] = useState('activos');
  const { toast, showSuccess, showError, clearToast } = useToast();

  useEffect(() => {
    cargarHorarios();
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

  const handleOpenConfirm = (horario, accion = 'archivar', event) => {
    if (event?.currentTarget?.blur) {
      event.currentTarget.blur();
    }
    setConfirmModal({ open: true, horario, accion });
  };

  const handleConfirmAction = async () => {
    const { horario, accion } = confirmModal;
    try {
      if (accion === 'desarchivar') {
        await desarchivarHorario(horario.id);
        showSuccess('Horario restaurado con éxito');
      } else {
        await archivarHorario(horario.id);
        showSuccess('Horario archivado con éxito');
      }
    } catch (error) {
      showError(formatErrorMessage(error));
    } finally {
      setConfirmModal({ open: false, horario: null, accion: 'archivar' });
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

      showSuccess(currentHorario ? 'Horario actualizado con éxito' : 'Horario creado con éxito');
      handleCloseForm();
    } catch (error) {
      showError(formatErrorMessage(error));
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
        if (!documento) {
          return <span className="text-gray-400">Sin documento</span>;
        }

        return (
          <button
            type="button"
            onClick={() => descargarDocumentoHorario(row.id, documento.nombre || `horario_${row.id}`)}
            className="text-[#185fa5] hover:underline text-sm"
          >
            Descargar
          </button>
        );
      },
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (row) => (
        <div className="flex justify-end gap-2">
          {viewMode === 'archivados' ? (
            <BtnRestaurar onClick={() => handleOpenConfirm(row, 'desarchivar')} />
          ) : (
            <>
              <BtnEditar onClick={() => handleEditHorario(row)} />
              <BtnArchivar onClick={(e) => handleOpenConfirm(row, 'archivar', e)} />
            </>
          )}
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
        title={confirmModal.accion === 'desarchivar' ? 'Restaurar Horario' : 'Archivar Horario'}
        message={confirmModal.accion === 'desarchivar'
          ? 'El horario volverá a estar visible para el docente asignado.'
          : 'Este horario se moverá a la vista de archivados y dejará de ser visible para el docente.'
        }
        variant={confirmModal.accion === 'desarchivar' ? 'info' : 'warning'}
        confirmLabel={confirmModal.accion === 'desarchivar' ? 'Restaurar' : 'Archivar'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal({ open: false, horario: null, accion: 'archivar' })}
        loading={uploading}
      />

      <Toast message={toast?.message} variant={toast?.variant} onClose={clearToast} />
    </div>
  );
}