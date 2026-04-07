import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageHeader,
  ActiveArchiveToggle,
  SearchFilter,
  DataTable,
  ConfirmModal,
  FormModal,
  StatusBadge,
} from '../../../../components/ui';
import {
  fetchEstudiantesUsuarios,
  updateEstudiante,
  deleteEstudiante,
} from '../../../../api/usuariosService';

const defaultForm = {
  nombre: '',
  primer_apellido: '',
  segundo_apellido: '',
  identificacion: '',
  email_institucional: '',
  telefono_principal: '',
  estado_estudiante: 'activo',
  tipo_estudiante: 'regular',
};

const getPersonaId = (estudiante) =>
  typeof estudiante?.persona === 'object' ? estudiante?.persona?.id : estudiante?.persona;

export default function Estudiantes() {
  const navigate = useNavigate();

  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('activos'); // 'activos' o 'archivados'

  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingEstudiante, setEditingEstudiante] = useState(null);
  const [formData, setFormData] = useState(defaultForm);

  const [confirmModal, setConfirmModal] = useState({ open: false, estudiante: null });

  const loadEstudiantes = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await fetchEstudiantesUsuarios();
      const list = Array.isArray(data) ? data : data?.results || [];
      setEstudiantes(list);
    } catch (error) {
      setErrorMessage('No se pudieron cargar los estudiantes.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEstudiantes();
  }, []);

  const estudiantesFiltrados = useMemo(() => {
    // Primero filtrar por estado
    const estudiantesTabla = activeTab === 'activos'
      ? estudiantes.filter((e) => {
          const persona = typeof e.persona === 'object' ? e.persona : {};
          return persona.activo !== false && persona.activo !== 'false';
        })
      : estudiantes.filter((e) => {
          const persona = typeof e.persona === 'object' ? e.persona : {};
          return persona.activo === false || persona.activo === 'true';
        });

    if (!searchValue.trim()) return estudiantesTabla;
    const term = searchValue.toLowerCase().trim();

    return estudiantesTabla.filter((item) => {
      const persona = typeof item.persona === 'object' ? item.persona : {};
      const nombre = `${item.nombre || persona.nombre || ''} ${item.primer_apellido || persona.primer_apellido || ''} ${
        item.segundo_apellido || persona.segundo_apellido || ''
      }`
        .toLowerCase()
        .trim();
      const identificacion = String(item.identificacion || persona.identificacion || '').toLowerCase();
      const codigo = String(item.codigo_estudiante || '').toLowerCase();
      return nombre.includes(term) || identificacion.includes(term) || codigo.includes(term);
    });
  }, [estudiantes, searchValue, activeTab]);

  const openEditForm = (estudiante) => {
    setEditingEstudiante(estudiante);
    setFormData({
      nombre: estudiante.nombre || estudiante?.persona?.nombre || '',
      primer_apellido: estudiante.primer_apellido || estudiante?.persona?.primer_apellido || '',
      segundo_apellido: estudiante.segundo_apellido || estudiante?.persona?.segundo_apellido || '',
      identificacion: estudiante.identificacion || estudiante?.persona?.identificacion || '',
      email_institucional: estudiante.email_institucional || '',
      telefono_principal: estudiante.telefono_principal || '',
      estado_estudiante: estudiante.estado_estudiante || 'activo',
      tipo_estudiante: estudiante.tipo_estudiante || 'regular',
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingEstudiante(null);
    setFormData(defaultForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!editingEstudiante) return;

    const personaId = getPersonaId(editingEstudiante);
    if (!personaId) {
      setErrorMessage('No fue posible identificar el estudiante a editar.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    setFormLoading(true);
    try {
      await updateEstudiante(personaId, formData);
      setSuccessMessage('Estudiante actualizado correctamente.');
      setTimeout(() => setSuccessMessage(''), 3000);
      closeForm();
      await loadEstudiantes();
    } catch (error) {
      setErrorMessage('No fue posible actualizar el estudiante.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setFormLoading(false);
    }
  };

  const handleArchive = async () => {
    const estudiante = confirmModal.estudiante;
    const personaId = getPersonaId(estudiante);
    if (!personaId) {
      setConfirmModal({ open: false, estudiante: null });
      return;
    }

    try {
      await deleteEstudiante(personaId);
      const action = activeTab === 'activos' ? 'archivado' : 'reactivado';
      setSuccessMessage(`Estudiante ${action} correctamente.`);
      setTimeout(() => setSuccessMessage(''), 3000);
      setConfirmModal({ open: false, estudiante: null });
      await loadEstudiantes();
    } catch (error) {
      setErrorMessage('No fue posible completar la acción.');
      setTimeout(() => setErrorMessage(''), 4000);
      setConfirmModal({ open: false, estudiante: null });
    }
  };

  const columns = [
    {
      key: 'nombre',
      label: 'Estudiante',
      render: (row) => {
        const persona = typeof row.persona === 'object' ? row.persona : {};
        const nombre = `${row.nombre || persona.nombre || ''} ${
          row.primer_apellido || persona.primer_apellido || ''
        } ${row.segundo_apellido || persona.segundo_apellido || ''}`.trim();
        const identificacion = row.identificacion || persona.identificacion || 'Sin identificación';
        return (
          <div>
            <div className="font-medium text-slate-900">{nombre || 'Sin nombre'}</div>
            <div className="text-xs text-slate-500">{identificacion}</div>
          </div>
        );
      },
    },
    {
      key: 'codigo_estudiante',
      label: 'Código',
      render: (row) => <span className="text-slate-600">{row.codigo_estudiante || '-'}</span>,
    },
    {
      key: 'grupo_actual',
      label: 'Grupo actual',
      render: (row) => {
        const grupo = row.grupo_actual;
        if (!grupo) return <span className="text-slate-500">Sin grupo</span>;
        return (
          <span className="text-slate-600">
            {grupo.nombre} ({grupo.grado || 'Sin grado'})
          </span>
        );
      },
    },
    {
      key: 'estado_estudiante',
      label: 'Estado',
      render: (row) => <StatusBadge status={row.estado_estudiante || 'activo'} size="sm" />,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => openEditForm(row)}
            className="rounded-md bg-[#185fa5] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#378add]"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => setConfirmModal({ open: true, estudiante: row })}
            className={`rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors ${
              activeTab === 'activos'
                ? 'bg-[#0b2545] hover:bg-[#081a31]'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {activeTab === 'activos' ? 'Archivar' : 'Reactivar'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios - Estudiantes"
        subtitle="Administra, edita y archiva estudiantes del sistema"
        action={{
          label: 'Volver a Usuarios',
          onClick: () => navigate('/usuarios'),
          icon: '←',
        }}
      />

      <ActiveArchiveToggle
        viewMode={activeTab}
        onChange={setActiveTab}
        activeLabel="Estudiantes Activos"
        archivedLabel="Estudiantes Archivados"
        activeCount={estudiantes.filter((e) => {
          const persona = typeof e.persona === 'object' ? e.persona : {};
          return persona.activo !== false && persona.activo !== 'false';
        }).length}
        archivedCount={estudiantes.filter((e) => {
          const persona = typeof e.persona === 'object' ? e.persona : {};
          return persona.activo === false || persona.activo === 'true';
        }).length}
      />

      <SearchFilter
        value={searchValue}
        onChange={setSearchValue}
        placeholder="Buscar por nombre, cédula o código..."
      />

      <DataTable
        columns={columns}
        data={estudiantesFiltrados}
        loading={loading}
        emptyMessage="No hay estudiantes que coincidan con la búsqueda"
      />

      <FormModal
        open={formOpen}
        onClose={closeForm}
        onSubmit={handleSubmit}
        title="Editar Estudiante"
        submitLabel={formLoading ? 'Guardando...' : 'Guardar cambios'}
        loading={formLoading}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-700">
            Nombre
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
          </label>
          <label className="text-sm text-slate-700">
            Primer apellido
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={formData.primer_apellido}
              onChange={(e) => setFormData({ ...formData, primer_apellido: e.target.value })}
            />
          </label>
          <label className="text-sm text-slate-700">
            Segundo apellido
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={formData.segundo_apellido}
              onChange={(e) => setFormData({ ...formData, segundo_apellido: e.target.value })}
            />
          </label>
          <label className="text-sm text-slate-700">
            Identificación
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={formData.identificacion}
              onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
            />
          </label>
          <label className="text-sm text-slate-700 md:col-span-2">
            Correo institucional
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={formData.email_institucional}
              onChange={(e) => setFormData({ ...formData, email_institucional: e.target.value })}
            />
          </label>
          <label className="text-sm text-slate-700">
            Teléfono principal
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={formData.telefono_principal}
              onChange={(e) => setFormData({ ...formData, telefono_principal: e.target.value })}
            />
          </label>
          <label className="text-sm text-slate-700">
            Tipo estudiante
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={formData.tipo_estudiante}
              onChange={(e) => setFormData({ ...formData, tipo_estudiante: e.target.value })}
            >
              <option value="regular">Regular</option>
              <option value="especial">Especial</option>
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Estado
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={formData.estado_estudiante}
              onChange={(e) => setFormData({ ...formData, estado_estudiante: e.target.value })}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </label>
        </div>
      </FormModal>

      <ConfirmModal
        open={confirmModal.open}
        title={activeTab === 'activos' ? 'Archivar Estudiante' : 'Reactivar Estudiante'}
        message={
          activeTab === 'activos'
            ? 'Este estudiante pasará a estado inactivo y dejará de aparecer en listados activos.'
            : 'Este estudiante volverá a estar activo en el sistema.'
        }
        variant={activeTab === 'activos' ? 'warning' : 'info'}
        confirmLabel={activeTab === 'activos' ? 'Archivar' : 'Reactivar'}
        onConfirm={handleArchive}
        onCancel={() => setConfirmModal({ open: false, estudiante: null })}
      />

      {successMessage ? (
        <div className="fixed bottom-4 right-4 z-[1300] rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="fixed bottom-4 left-4 z-[1300] rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
