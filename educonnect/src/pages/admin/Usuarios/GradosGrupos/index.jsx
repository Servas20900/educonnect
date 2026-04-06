import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import {
  PageHeader,
  SearchFilter,
  ConfirmModal,
  FormModal,
} from '../../../../components/ui';
import CustomSelect from '../../../../components/ui/CustomSelect';
import {
  fetchGruposPorGrado,
  fetchGrados,
  createGrupo,
  updateGrupo,
  deleteGrupo,
  fetchDocentes,
} from '../../../../api/usuariosService';

const GRADOS_ORDEN = [
  { numero: 1, nombre: 'Primero' },
  { numero: 2, nombre: 'Segundo' },
  { numero: 3, nombre: 'Tercero' },
  { numero: 4, nombre: 'Cuarto' },
  { numero: 5, nombre: 'Quinto' },
  { numero: 6, nombre: 'Sexto' },
];

const CUPOS_POR_GRUPO = 30;

export default function GradosGrupos() {
  const navigate = useNavigate();
  const { control, handleSubmit: formHandleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      grado: '',
      nombre: '',
      docente_guia: '',
      aula: '',
    },
  });

  const [gruposPorGrado, setGruposPorGrado] = useState([]);
  const [gradosActivos, setGradosActivos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedGrados, setExpandedGrados] = useState({});

  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState(null);

  const [confirmModal, setConfirmModal] = useState({ open: false, grupo: null });

  const loadData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [gruposData, docentesData] = await Promise.all([
        fetchGruposPorGrado(),
        fetchDocentes(),
      ]);

      // Organizar grupos por grado
      const gruposRaw = Array.isArray(gruposData) ? gruposData : [];
      const gradosOrdenados = GRADOS_ORDEN.map((base) => {
        const gradoData = gruposRaw.find((g) => g.numero_grado === base.numero);
        return {
          grado_id: gradoData?.grado_id || null,
          grado_nombre: gradoData?.grado_nombre || base.nombre,
          numero_grado: base.numero,
          grupos: gradoData?.grupos || [],
        };
      });

      setGruposPorGrado(gradosOrdenados);
      setDocentes(Array.isArray(docentesData) ? docentesData : docentesData?.results || []);

      try {
        const gradosData = await fetchGrados();
        setGradosActivos(Array.isArray(gradosData) ? gradosData : gradosData?.results || []);
      } catch (gradoError) {
        setGradosActivos(
          gradosOrdenados
            .filter((grado) => grado.grado_id)
            .map((grado) => ({
              id: grado.grado_id,
              nombre: grado.grado_nombre,
              numero_grado: grado.numero_grado,
            }))
        );
      }

      // Expandir primer grado por defecto
      if (gradosOrdenados.length > 0) {
        setExpandedGrados({ [gradosOrdenados[0].numero_grado]: true });
      }
    } catch (error) {
      setErrorMessage('No se pudieron cargar los grupos.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleGrado = (numeroGrado) => {
    setExpandedGrados((prev) => ({
      ...prev,
      [numeroGrado]: !prev[numeroGrado],
    }));
  };

  const gruposFiltrados = useMemo(() => {
    if (!searchValue.trim()) return gruposPorGrado;
    const term = searchValue.toLowerCase().trim();

    return gruposPorGrado.map((grado) => ({
      ...grado,
      grupos: grado.grupos.filter((item) => {
        const nombre = String(item.nombre || '').toLowerCase();
        const docente = String(item.docente_guia_nombre || '').toLowerCase();
        return nombre.includes(term) || docente.includes(term);
      }),
    }));
  }, [gruposPorGrado, searchValue]);

  const gradosParaFormulario = useMemo(() => {
    if (gradosActivos.length > 0) return gradosActivos;

    return gruposPorGrado
      .filter((grado) => grado.grado_id)
      .map((grado) => ({
        id: grado.grado_id,
        nombre: grado.grado_nombre,
        numero_grado: grado.numero_grado,
      }));
  }, [gradosActivos, gruposPorGrado]);

  const openNewForm = () => {
    setEditingGrupo(null);
    reset({ grado: '', nombre: '', docente_guia: '', aula: '' });
    setFormOpen(true);
  };

  const openEditForm = (grupo) => {
    setEditingGrupo(grupo);
    reset({
      grado: grupo.grado?.toString() || '',
      nombre: grupo.nombre || '',
      docente_guia: grupo.docente_guia?.toString() || '',
      aula: grupo.aula || '',
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingGrupo(null);
    reset();
  };

  const handleFormSubmit = async (data) => {
    if (!data.grado || !data.nombre) {
      setErrorMessage('Grado y nombre son requeridos.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    setFormLoading(true);
    try {
      if (editingGrupo) {
        await updateGrupo(editingGrupo.id, {
          grado: Number(data.grado),
          nombre: data.nombre,
          docente_guia: data.docente_guia ? Number(data.docente_guia) : null,
          aula: data.aula || '',
        });
        setSuccessMessage('Grupo actualizado correctamente.');
      } else {
        await createGrupo({
          grado: Number(data.grado),
          nombre: data.nombre,
          docente_guia: data.docente_guia ? Number(data.docente_guia) : null,
          aula: data.aula || '',
        });
        setSuccessMessage('Grupo creado correctamente.');
      }
      setTimeout(() => setSuccessMessage(''), 3000);
      closeForm();
      await loadData();
    } catch (error) {
      setErrorMessage('No fue posible completar la acción.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setFormLoading(false);
    }
  };

  const handleArchive = async () => {
    const grupo = confirmModal.grupo;
    try {
      await deleteGrupo(grupo.id);
      setSuccessMessage('Grupo archivado correctamente.');
      setTimeout(() => setSuccessMessage(''), 3000);
      setConfirmModal({ open: false, grupo: null });
      await loadData();
    } catch (error) {
      setErrorMessage('No fue posible archivar el grupo.');
      setTimeout(() => setErrorMessage(''), 4000);
      setConfirmModal({ open: false, grupo: null });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios - Grados y Grupos"
        subtitle="Organiza grupos por grado"
        action={{
          label: 'Nuevo Grupo',
          onClick: openNewForm,
          icon: '+',
        }}
      />

      <SearchFilter
        value={searchValue}
        onChange={setSearchValue}
        placeholder="Buscar por nombre del grupo o docente..."
      />

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#185fa5]"></div>
          </div>
        ) : gruposFiltrados.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No hay grados para mostrar
          </div>
        ) : (
          gruposFiltrados.map((grado) => (
            <div key={grado.numero_grado} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              {/* Grado Header */}
              <button
                onClick={() => toggleGrado(grado.numero_grado)}
                className="w-full flex items-center justify-between p-4 bg-[#0b2545] hover:bg-[#185fa5] text-white transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  {expandedGrados[grado.numero_grado] ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  <div>
                    <div className="font-semibold">{grado.grado_nombre}</div>
                    <div className="text-xs text-blue-100">{grado.grupos.length} grupo(s)</div>
                  </div>
                </div>
              </button>

              {/* Grupos List */}
              {expandedGrados[grado.numero_grado] && (
                <div className="divide-y divide-slate-200">
                  {grado.grupos.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-sm">
                      No hay grupos en este grado
                    </div>
                  ) : (
                    grado.grupos.map((grupo) => (
                      <div key={grupo.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">{grupo.nombre}</div>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-600">
                              <div>
                                <span className="font-medium text-slate-700">Docente:</span>{' '}
                                {grupo.docente_guia_nombre || 'Sin asignar'}
                              </div>
                              <div>
                                <span className="font-medium text-slate-700">Aula:</span>{' '}
                                {grupo.aula || '-'}
                              </div>
                              <div>
                                <span className="font-medium text-slate-700">Capacidad:</span>{' '}
                                {grupo.cantidad_estudiantes || 0}/{CUPOS_POR_GRUPO}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              type="button"
                              onClick={() => navigate(`/usuarios/grados-grupos/${grupo.id}/estudiantes`)}
                              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                            >
                              Estudiantes
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditForm(grupo)}
                              className="rounded-md bg-[#0b2545] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#185fa5]"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmModal({ open: true, grupo })}
                              className="rounded-md bg-[#0b2545] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#185fa5]"
                            >
                              Archivar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <FormModal
        open={formOpen}
        onClose={closeForm}
        onSubmit={formHandleSubmit(handleFormSubmit)}
        title={editingGrupo ? 'Editar Grupo' : 'Nuevo Grupo'}
        submitLabel={formLoading ? 'Guardando...' : editingGrupo ? 'Actualizar' : 'Crear Grupo'}
        loading={formLoading}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Grado *
            </label>
            <Controller
              name="grado"
              control={control}
              rules={{ required: 'Debes seleccionar un grado' }}
              render={({ field }) => (
                <>
                  <select
                    {...field}
                    className={`w-full rounded-md border ${
                      errors.grado ? 'border-red-500' : 'border-slate-300'
                    } px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#185fa5]`}
                  >
                    <option value="">Seleccionar grado</option>
                    {gradosParaFormulario.map((grado) => (
                      <option key={grado.id} value={String(grado.id)}>
                        {grado.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.grado && (
                    <p className="mt-1 text-xs text-red-500">{errors.grado.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre del Grupo *
            </label>
            <Controller
              name="nombre"
              control={control}
              rules={{ required: 'El nombre es obligatorio' }}
              render={({ field }) => (
                <>
                  <input
                    {...field}
                    type="text"
                    placeholder="Ej: Primero A"
                    className={`w-full rounded-md border ${
                      errors.nombre ? 'border-red-500' : 'border-slate-300'
                    } px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#185fa5]`}
                  />
                  {errors.nombre && (
                    <p className="mt-1 text-xs text-red-500">{errors.nombre.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Docente Guía
            </label>
            <CustomSelect
              name="docente_guia"
              control={control}
              options={docentes.map((doc) => ({
                value: String(doc.persona?.id || ''),
                label: `${doc.nombre} ${doc.primer_apellido} ${doc.segundo_apellido || ''}`.trim(),
              }))}
              placeholder="Escribe para buscar docente..."
              isClearable
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Aula
            </label>
            <Controller
              name="aula"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder="Ej: A-101"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#185fa5]"
                />
              )}
            />
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        open={confirmModal.open}
        title="Archivar Grupo"
        message="Este grupo se moverá a la vista de archivados."
        variant="warning"
        confirmLabel="Archivar"
        onConfirm={handleArchive}
        onCancel={() => setConfirmModal({ open: false, grupo: null })}
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
