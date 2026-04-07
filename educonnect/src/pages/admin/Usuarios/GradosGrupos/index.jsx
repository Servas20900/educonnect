import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, GraduationCap, MapPin, UserRound, Users } from 'lucide-react';
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

const getCapacityMeta = (cantidad) => {
  const estudiantes = Number(cantidad || 0);
  const percent = Math.min(100, Math.round((estudiantes / CUPOS_POR_GRUPO) * 100));

  if (percent >= 90) {
    return {
      percent,
      label: 'Lleno',
      chip: 'bg-rose-100 text-rose-700 border border-rose-200',
      bar: 'bg-rose-500',
    };
  }

  if (percent >= 65) {
    return {
      percent,
      label: 'Alto',
      chip: 'bg-amber-100 text-amber-700 border border-amber-200',
      bar: 'bg-amber-500',
    };
  }

  return {
    percent,
    label: 'Disponible',
    chip: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    bar: 'bg-emerald-500',
  };
};

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
            <div
              key={grado.numero_grado}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Grado Header */}
              <button
                onClick={() => toggleGrado(grado.numero_grado)}
                className="w-full border-b border-slate-200 bg-[#f4f8fc] px-4 py-3 text-slate-800 transition-colors hover:bg-[#eaf2fa]"
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="rounded-md bg-[#dbe9f7] p-1.5 text-[#185fa5]">
                    <GraduationCap className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Grado {grado.numero_grado}</div>
                    <div className="text-base font-semibold tracking-tight text-slate-800">{grado.grado_nombre}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Total grupos</div>
                    <div className="text-sm font-semibold text-slate-700">{grado.grupos.length}</div>
                  </div>
                  {expandedGrados[grado.numero_grado] ? (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  )}
                </div>
              </button>

              {/* Grupos List */}
              {expandedGrados[grado.numero_grado] && (
                <div className="bg-slate-50/70 p-4 md:p-5">
                  {grado.grupos.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                      No hay grupos en este grado
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      {grado.grupos.map((grupo) => {
                        const capacity = getCapacityMeta(grupo.cantidad_estudiantes || 0);
                        return (
                          <div
                            key={grupo.id}
                            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#185fa5]/30 hover:shadow"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="text-base font-semibold text-slate-900">{grupo.nombre}</h3>
                                <p className="mt-0.5 text-xs text-slate-500">Codigo de grupo #{grupo.id}</p>
                              </div>
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${capacity.chip}`}>
                                {capacity.label}
                              </span>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-2">
                              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                                <UserRound className="h-4 w-4 text-slate-500" />
                                <span className="truncate">{grupo.docente_guia_nombre || 'Sin docente asignado'}</span>
                              </div>
                              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                                <MapPin className="h-4 w-4 text-slate-500" />
                                <span>{grupo.aula || 'Aula no definida'}</span>
                              </div>
                            </div>

                            <div className="mt-4">
                              <div className="mb-1 flex items-center justify-between text-xs">
                                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                                  <Users className="h-3.5 w-3.5" />
                                  Estudiantes
                                </span>
                                <span className="font-semibold text-slate-700">
                                  {grupo.cantidad_estudiantes || 0}/{CUPOS_POR_GRUPO}
                                </span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className={`h-full rounded-full transition-all ${capacity.bar}`}
                                  style={{ width: `${capacity.percent}%` }}
                                />
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => navigate(`/usuarios/grados-grupos/${grupo.id}/estudiantes`)}
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                              >
                                <Users className="h-3.5 w-3.5" />
                                Estudiantes
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditForm(grupo)}
                                className="rounded-md border border-[#185fa5] bg-white px-3 py-1.5 text-xs font-semibold text-[#185fa5] transition-colors hover:bg-[#185fa5]/10"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmModal({ open: true, grupo })}
                                className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                              >
                                Archivar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
