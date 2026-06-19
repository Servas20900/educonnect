import { useEffect, useState } from 'react';
import { useHorarios } from './hooks/useHorarios';
import { useNavigate } from 'react-router-dom';
import useToast from '../../../hooks/useToast';
import {
  PageHeader,
  SearchFilter,
  DataTable,
  ConfirmModal,
  BtnRestaurar,
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

export default function HorariosArchivados() {
  const {
    cargarHorarios,
    horariosExistentes,
    loading,
    uploading,
    desarchivarHorario,
  } = useHorarios();

  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    horario: null,
  });
  const { toast, showSuccess, showError, clearToast } = useToast();

  useEffect(() => {
    cargarHorarios({ archivados_only: true });
  }, []);

  const filteredHorarios = horariosExistentes.filter((horario) => {
    const term = searchValue.toLowerCase();
    return (
      horario.nombre?.toLowerCase().includes(term) ||
      horario.docente_info?.nombre?.toLowerCase().includes(term)
    );
  });

  const handleConfirmAction = async () => {
    const { horario } = confirmModal;
    try {
      await desarchivarHorario(horario.id, 'Borrador');
      showSuccess('Horario desarchivado con éxito');
    } catch (error) {
      showError(formatErrorMessage(error));
    } finally {
      setConfirmModal({ open: false, horario: null });
    }
  };

  const tableColumns = [
    {
      key: 'nombre',
      label: 'Nombre del Horario',
      render: (row) => <div className="font-medium text-slate-900">{row.nombre}</div>,
    },
    {
      key: 'docente',
      label: 'Docente Asignado',
      render: (row) => (
        <span className="text-slate-600">{row.docente_info?.nombre || 'No asignado'}</span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (row) => <span className="text-slate-600">{row.estado || 'Archivado'}</span>,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (row) => (
        <BtnRestaurar onClick={() => setConfirmModal({ open: true, horario: row })} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Horarios Archivados" />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => navigate('/horarios')}
          className="rounded-md border border-[#185fa5] px-4 py-2 text-sm font-medium text-[#185fa5] transition-colors hover:bg-[#e6f1fb]"
        >
          Ver horarios sin archivar
        </button>
      </div>

      <SearchFilter
        value={searchValue}
        onChange={setSearchValue}
        placeholder="Buscar por nombre o docente..."
      />

      <DataTable
        columns={tableColumns}
        data={filteredHorarios}
        loading={loading}
        emptyMessage="No hay horarios archivados"
      />

      <ConfirmModal
        open={confirmModal.open}
        title="Desarchivar Horario"
        message="El horario volverá a la vista principal de horarios activos."
        variant="info"
        confirmLabel="Desarchivar"
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal({ open: false, horario: null })}
        loading={uploading}
      />

      <Toast message={toast?.message} variant={toast?.variant} onClose={clearToast} />
    </div>
  );
}
