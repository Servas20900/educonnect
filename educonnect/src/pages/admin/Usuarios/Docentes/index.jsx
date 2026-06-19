import { useEffect, useMemo, useState } from 'react';
import useAutoRefresh from '../../../../hooks/useAutoRefresh';
import { useNavigate } from 'react-router-dom';
import {
  PageHeader,
  ActiveArchiveToggle,
  SearchFilter,
  DataTable,
  ConfirmModal,
  FormModal,
  StatusBadge,
  BtnEditar,
  BtnArchivar,
  BtnReactivar,
  Toast,
} from '../../../../components/ui';
import useToast from '../../../../hooks/useToast';
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
  const { toast, showSuccess, showError, clearToast } = useToast();
  const [activeTab, setActiveTab] = useState('activos');

  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingDocente, setEditingDocente] = useState(null);
  const [formData, setFormData] = useState(defaultForm);

  const [confirmModal, setConfirmModal] = useState({ open: false, docente: null });

  const loadDocentes = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchDocentes();
      const list = Array.isArray(data) ? data : data?.results || [];
      setDocentes(list);
    } catch (error) {
      if (!silent) showError('No se pudieron cargar los docentes.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadDocentes();
  }, []);
  useAutoRefresh(() => loadDocentes(true));

  const docentesFiltrados = useMemo(() => {
    // Primero filtrar por estado (activos o archivados)
    const docentesTabla = activeTab === 'activos'
      ? docentes.filter((d) => d.persona?.activo !== false && d.persona?.activo !== 'false')
      : docentes.filter((d) => d.persona?.activo === false || d.persona?.activo === 'false');

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
      showError('No fue posible identificar el docente a editar.');
      return;
    }

    setFormLoading(true);
    try {
      await updateDocente(personaId, formData);
      showSuccess('Docente actualizado correctamente.');
      closeForm();
      await loadDocentes();
    } catch (error) {
      showError('No fue posible actualizar el docente.');
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
      showSuccess(`Docente ${activeTab === 'activos' ? 'archivado' : 'reactivado'} correctamente.`);
      setConfirmModal({ open: false, docente: null });
      await loadDocentes();
    } catch (error) {
      showError('No fue posible completar la acción.');
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
          <BtnEditar onClick={() => openEditForm(row)} />
          {activeTab === 'activos'
            ? <BtnArchivar onClick={() => setConfirmModal({ open: true, docente: row })} />
            : <BtnReactivar onClick={() => setConfirmModal({ open: true, docente: row })} />
          }
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
        archivedCount={docentes.filter((d) => d.persona?.activo === false || d.persona?.activo === 'false').length}
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

      <Toast message={toast?.message} variant={toast?.variant} onClose={clearToast} />
    </div>
  );
}
