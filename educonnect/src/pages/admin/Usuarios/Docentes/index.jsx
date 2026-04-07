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
import { fetchDocentes, updateDocente, deleteDocente } from '../../../../api/usuariosService';

const defaultForm = {
  nombre: '',
  primer_apellido: '',
  segundo_apellido: '',
  identificacion: '',
  email_institucional: '',
  telefono_principal: '',
  especialidad: '',
  nivel_academico: '',
  estado_laboral: 'activo',
};

const getPersonaId = (docente) =>
  typeof docente?.persona === 'object' ? docente?.persona?.id : docente?.persona;

export default function Docentes() {
  const navigate = useNavigate();

  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('activos'); // 'activos' o 'archivados'

  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingDocente, setEditingDocente] = useState(null);
  const [formData, setFormData] = useState(defaultForm);

  const [confirmModal, setConfirmModal] = useState({ open: false, docente: null });

  const loadDocentes = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await fetchDocentes();
      const list = Array.isArray(data) ? data : data?.results || [];
      setDocentes(list);
    } catch (error) {
      setErrorMessage('No se pudieron cargar los docentes.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocentes();
  }, []);

  const docentesFiltrados = useMemo(() => {
    // Primero filtrar por estado (activos o archivados)
    const docentesTabla = activeTab === 'activos'
      ? docentes.filter((d) => d.persona?.activo !== false && d.persona?.activo !== 'false')
      : docentes.filter((d) => d.persona?.activo === false || d.persona?.activo === 'true');

    if (!searchValue.trim()) return docentesTabla;
    const term = searchValue.toLowerCase().trim();

    return docentesTabla.filter((item) => {
      const nombre = `${item.nombre || ''} ${item.primer_apellido || ''} ${item.segundo_apellido || ''}`
        .toLowerCase()
        .trim();
      const identificacion = String(item.identificacion || '').toLowerCase();
      const codigo = String(item.codigo_empleado || '').toLowerCase();
      const especialidad = String(item.especialidad || '').toLowerCase();
      return (
        nombre.includes(term) ||
        identificacion.includes(term) ||
        codigo.includes(term) ||
        especialidad.includes(term)
      );
    });
  }, [docentes, searchValue, activeTab]);

  const openEditForm = (docente) => {
    setEditingDocente(docente);
    setFormData({
      nombre: docente.nombre || '',
      primer_apellido: docente.primer_apellido || '',
      segundo_apellido: docente.segundo_apellido || '',
      identificacion: docente.identificacion || '',
      email_institucional: docente.email_institucional || '',
      telefono_principal: docente.telefono_principal || '',
      especialidad: docente.especialidad || '',
      nivel_academico: docente.nivel_academico || '',
      estado_laboral: docente.estado_laboral || 'activo',
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingDocente(null);
    setFormData(defaultForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!editingDocente) return;

    const personaId = getPersonaId(editingDocente);
    if (!personaId) {
      setErrorMessage('No fue posible identificar el docente a editar.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    setFormLoading(true);
    try {
      await updateDocente(personaId, formData);
      setSuccessMessage('Docente actualizado correctamente.');
      setTimeout(() => setSuccessMessage(''), 3000);
      closeForm();
      await loadDocentes();
    } catch (error) {
      setErrorMessage('No fue posible actualizar el docente.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setFormLoading(false);
    }
  };

  const handleArchive = async () => {
    const docente = confirmModal.docente;
    const personaId = getPersonaId(docente);
    if (!personaId) {
      setConfirmModal({ open: false, docente: null });
      return;
    }

    try {
      await deleteDocente(personaId);
      const action = activeTab === 'activos' ? 'archivado' : 'reactivado';
      setSuccessMessage(`Docente ${action} correctamente.`);
      setTimeout(() => setSuccessMessage(''), 3000);
      setConfirmModal({ open: false, docente: null });
      await loadDocentes();
    } catch (error) {
      setErrorMessage('No fue posible completar la acción.');
      setTimeout(() => setErrorMessage(''), 4000);
      setConfirmModal({ open: false, docente: null });
    }
  };

  const columns = [
    {
      key: 'nombre',
      label: 'Docente',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900">
            {row.nombre} {row.primer_apellido} {row.segundo_apellido}
          </div>
          <div className="text-xs text-slate-500">{row.identificacion || 'Sin identificación'}</div>
        </div>
      ),
    },
    {
      key: 'codigo_empleado',
      label: 'Código',
      render: (row) => <span className="text-slate-600">{row.codigo_empleado || '-'}</span>,
    },
    {
      key: 'especialidad',
      label: 'Especialidad',
      render: (row) => <span className="text-slate-600">{row.especialidad || 'Sin especialidad'}</span>,
    },
    {
      key: 'estado_laboral',
      label: 'Estado',
      render: (row) => <StatusBadge status={row.estado_laboral || 'activo'} size="sm" />,
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
            onClick={() => setConfirmModal({ open: true, docente: row })}
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
        title="Usuarios - Docentes"
        subtitle="Administra, edita y archiva docentes del sistema"
        action={{
          label: 'Volver a Usuarios',
          onClick: () => navigate('/usuarios'),
          icon: '←',
        }}
      />

      <ActiveArchiveToggle
        viewMode={activeTab}
        onChange={setActiveTab}
        activeLabel="Docentes Activos"
        archivedLabel="Docentes Archivados"
        activeCount={docentes.filter((d) => d.persona?.activo !== false && d.persona?.activo !== 'false').length}
        archivedCount={docentes.filter((d) => d.persona?.activo === false || d.persona?.activo === 'true').length}
      />

      <SearchFilter
        value={searchValue}
        onChange={setSearchValue}
        placeholder="Buscar por nombre, cédula, código o especialidad..."
      />

      <DataTable
        columns={columns}
        data={docentesFiltrados}
        loading={loading}
        emptyMessage="No hay docentes que coincidan con la búsqueda"
      />

      <FormModal
        open={formOpen}
        onClose={closeForm}
        onSubmit={handleSubmit}
        title="Editar Docente"
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
            Especialidad
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={formData.especialidad}
              onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
            />
          </label>
          <label className="text-sm text-slate-700">
            Nivel académico
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={formData.nivel_academico}
              onChange={(e) => setFormData({ ...formData, nivel_academico: e.target.value })}
            />
          </label>
          <label className="text-sm text-slate-700">
            Estado laboral
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={formData.estado_laboral}
              onChange={(e) => setFormData({ ...formData, estado_laboral: e.target.value })}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </label>
        </div>
      </FormModal>

      <ConfirmModal
        open={confirmModal.open}
        title={activeTab === 'activos' ? 'Archivar Docente' : 'Reactivar Docente'}
        message={
          activeTab === 'activos'
            ? 'Este docente pasará a estado inactivo y dejará de aparecer en listados activos.'
            : 'Este docente volverá a estar activo en el sistema.'
        }
        variant={activeTab === 'activos' ? 'warning' : 'info'}
        confirmLabel={activeTab === 'activos' ? 'Archivar' : 'Reactivar'}
        onConfirm={handleArchive}
        onCancel={() => setConfirmModal({ open: false, docente: null })}
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
