import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  fetchEstudiantesUsuarios,
  createEstudiante,
  updateEstudiante,
  deleteEstudiante,
  importarEstudiantes,
  fetchGrupos,
} from '../../../../api/usuariosService';

const CSV_TEMPLATE = `nombre,primer_apellido,segundo_apellido,identificacion,email
Juan,Pérez,Mora,123456789,juan.perez@ejemplo.com
María,López,,987654321,`;

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

const defaultRegistroForm = {
  nombre: '',
  primer_apellido: '',
  segundo_apellido: '',
  identificacion: '',
  email: '',
  password: '',
  grupo_id: '',
};

const getPersonaId = (estudiante) =>
  typeof estudiante?.persona === 'object' ? estudiante?.persona?.id : estudiante?.persona;

export default function Estudiantes() {
  const navigate = useNavigate();

  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const { toast, showSuccess, showError, clearToast } = useToast();
  const [activeTab, setActiveTab] = useState('activos');

  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingEstudiante, setEditingEstudiante] = useState(null);
  const [formData, setFormData] = useState(defaultForm);

  const [confirmModal, setConfirmModal] = useState({ open: false, estudiante: null });

  // Registro
  const [registroOpen, setRegistroOpen] = useState(false);
  const [registroLoading, setRegistroLoading] = useState(false);
  const [registroForm, setRegistroForm] = useState(defaultRegistroForm);
  const [grupos, setGrupos] = useState([]);

  // Importar
  const [importarOpen, setImportarOpen] = useState(false);
  const [importarLoading, setImportarLoading] = useState(false);
  const [importarArchivo, setImportarArchivo] = useState(null);
  const [importarGrupoId, setImportarGrupoId] = useState('');
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef(null);

  const loadEstudiantes = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchEstudiantesUsuarios();
      const list = Array.isArray(data) ? data : data?.results || [];
      setEstudiantes(list);
    } catch (error) {
      if (!silent) showError('No se pudieron cargar los estudiantes.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadEstudiantes();
    fetchGrupos({ estado: 'activo' }).then((data) => {
      const list = Array.isArray(data) ? data : data?.results || [];
      setGrupos(list);
    }).catch(() => {});
  }, []);
  useAutoRefresh(() => loadEstudiantes(true));

  const estudiantesFiltrados = useMemo(() => {
    // Primero filtrar por estado
    const estudiantesTabla = activeTab === 'activos'
      ? estudiantes.filter((e) => {
          const persona = typeof e.persona === 'object' ? e.persona : {};
          return persona.activo !== false && persona.activo !== 'false';
        })
      : estudiantes.filter((e) => {
          const persona = typeof e.persona === 'object' ? e.persona : {};
          return persona.activo === false || persona.activo === 'false';
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
      showError('No fue posible identificar el estudiante a editar.');
      return;
    }

    setFormLoading(true);
    try {
      await updateEstudiante(personaId, formData);
      showSuccess('Estudiante actualizado correctamente.');
      closeForm();
      await loadEstudiantes();
    } catch (error) {
      showError('No fue posible actualizar el estudiante.');
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
      showSuccess(`Estudiante ${activeTab === 'activos' ? 'archivado' : 'reactivado'} correctamente.`);
      setConfirmModal({ open: false, estudiante: null });
      await loadEstudiantes();
    } catch (error) {
      showError('No fue posible completar la acción.');
      setConfirmModal({ open: false, estudiante: null });
    }
  };

  const handleRegistroSubmit = async (e) => {
    e.preventDefault();
    setRegistroLoading(true);
    try {
      await createEstudiante(registroForm);
      showSuccess('Estudiante registrado correctamente.');
      setRegistroOpen(false);
      setRegistroForm(defaultRegistroForm);
      await loadEstudiantes();
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message || 'Error al registrar.';
      showError(detail);
    } finally {
      setRegistroLoading(false);
    }
  };

  const handleImportarSubmit = async (e) => {
    e.preventDefault();
    if (!importarGrupoId) { showError('Debes seleccionar un grupo.'); return; }
    if (!importarArchivo) { showError('Selecciona un archivo.'); return; }
    setImportarLoading(true);
    setImportResult(null);
    try {
      const res = await importarEstudiantes(importarArchivo, importarGrupoId);
      setImportResult(res);
      setImportarArchivo(null);
      if (fileRef.current) fileRef.current.value = '';
      await loadEstudiantes();
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message || 'Error al importar.';
      setImportResult({ error: detail });
    } finally {
      setImportarLoading(false);
    }
  };

  const descargarPlantilla = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_estudiantes.csv';
    a.click();
    URL.revokeObjectURL(url);
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
          <BtnEditar onClick={() => openEditForm(row)} />
          {activeTab === 'activos'
            ? <BtnArchivar onClick={() => setConfirmModal({ open: true, estudiante: row })} />
            : <BtnReactivar onClick={() => setConfirmModal({ open: true, estudiante: row })} />
          }
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios - Estudiantes"
        subtitle="Administra, registra e importa estudiantes del sistema"
        action={{
          label: 'Volver a Usuarios',
          onClick: () => navigate('/usuarios'),
          icon: '←',
        }}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setRegistroOpen(true); setRegistroForm(defaultRegistroForm); }}
          className="rounded-lg bg-[#185fa5] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#0c447c]"
        >
          + Registrar estudiante
        </button>
        <button
          type="button"
          onClick={() => { setImportarOpen(true); setImportResult(null); setImportarGrupoId(''); }}
          className="rounded-lg border border-[#185fa5] px-4 py-2 text-sm font-medium text-[#185fa5] hover:bg-blue-50"
        >
          Importar CSV / Excel
        </button>
      </div>

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
          return persona.activo === false || persona.activo === 'false';
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

      {/* Modal Registrar */}
      <FormModal
        open={registroOpen}
        onClose={() => setRegistroOpen(false)}
        onSubmit={handleRegistroSubmit}
        title="Registrar nuevo estudiante"
        submitLabel={registroLoading ? 'Registrando...' : 'Registrar estudiante'}
        loading={registroLoading}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            { key: 'nombre', label: 'Nombre', required: true },
            { key: 'primer_apellido', label: 'Primer apellido', required: true },
            { key: 'segundo_apellido', label: 'Segundo apellido', required: false },
            { key: 'identificacion', label: 'Identificación', required: true },
            { key: 'email', label: 'Correo electrónico', required: false, type: 'email' },
            { key: 'password', label: 'Contraseña inicial', required: false, placeholder: 'Por defecto: identificación' },
          ].map(({ key, label, required, type, placeholder }) => (
            <label key={key} className="text-sm text-slate-700">
              {label}{required && <span className="text-red-500"> *</span>}
              <input
                type={type || 'text'}
                required={required}
                placeholder={placeholder || ''}
                value={registroForm[key]}
                onChange={(e) => setRegistroForm((p) => ({ ...p, [key]: e.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#378add]"
              />
            </label>
          ))}

          <label className="text-sm text-slate-700 md:col-span-2">
            Grupo <span className="text-red-500">*</span>
            <select
              required
              value={registroForm.grupo_id}
              onChange={(e) => setRegistroForm((p) => ({ ...p, grupo_id: e.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#378add]"
            >
              <option value="">Seleccionar grupo</option>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre}{g.grado?.nombre ? ` — ${g.grado.nombre}` : ''}{g.docente_guia_nombre ? ` (${g.docente_guia_nombre})` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Si no se indica contraseña, se usará el número de identificación como contraseña inicial.
        </p>
      </FormModal>

      {/* Modal Importar */}
      <FormModal
        open={importarOpen}
        onClose={() => setImportarOpen(false)}
        onSubmit={handleImportarSubmit}
        title="Importar estudiantes desde archivo"
        submitLabel={importarLoading ? 'Importando...' : 'Importar archivo'}
        loading={importarLoading}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <p className="mb-2 text-xs font-semibold text-blue-800">Formato esperado:</p>
            <pre className="overflow-x-auto rounded-md border border-blue-200 bg-white p-3 text-xs text-slate-700">{`nombre,primer_apellido,segundo_apellido,identificacion,email
Juan,Pérez,Mora,123456789,juan@ejemplo.com
María,López,,987654321,`}</pre>
            <p className="mt-2 text-xs text-blue-700">
              <strong>Obligatorias:</strong> nombre, primer_apellido, identificacion<br />
              <strong>Opcionales:</strong> segundo_apellido, email<br />
              La contraseña inicial será el número de identificación.
            </p>
            <button
              type="button"
              onClick={descargarPlantilla}
              className="mt-3 rounded-md border border-blue-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
            >
              Descargar plantilla CSV
            </button>
          </div>

          <label className="text-sm text-slate-700">
            Grupo <span className="text-red-500">*</span>
            <select
              required
              value={importarGrupoId}
              onChange={(e) => setImportarGrupoId(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#378add]"
            >
              <option value="">Seleccionar grupo</option>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre}{g.grado?.nombre ? ` — ${g.grado.nombre}` : ''}{g.docente_guia_nombre ? ` (${g.docente_guia_nombre})` : ''}
                </option>
              ))}
            </select>
          </label>

          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setImportarArchivo(e.target.files[0] || null)}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-700 hover:file:bg-gray-50"
          />

          {importResult && (
            <div className={`rounded-md border p-3 text-sm space-y-1 ${importResult.error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-800'}`}>
              {importResult.error ? (
                <p>{importResult.error}</p>
              ) : (
                <>
                  <p className="font-medium">{importResult.message}</p>
                  <p>Creados nuevos: <strong>{importResult.creados ?? 0}</strong></p>
                  <p>Ya existían: <strong>{importResult.existentes ?? 0}</strong></p>
                  {importResult.errores?.length > 0 && (
                    <p className="text-red-700">Con errores: {importResult.errores.join(', ')}</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </FormModal>

      <Toast message={toast?.message} variant={toast?.variant} onClose={clearToast} />
    </div>
  );
}
