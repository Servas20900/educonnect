import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users, UserMinus, ArrowRightLeft } from 'lucide-react';
import { ConfirmModal, DataTable, EmptyState, PageHeader, SearchFilter, StatusBadge } from '../../../../components/ui';
import {
  asignarEstudianteGrupo,
  fetchEstudiantesGrupo,
  fetchEstudiantesUsuarios,
  fetchGrupoDetail,
  removerEstudianteGrupo,
} from '../../../../api/usuariosService';

const getPersona = (estudiante) => (typeof estudiante?.persona === 'object' ? estudiante.persona : {});

const getPersonaId = (estudiante) => {
  const persona = getPersona(estudiante);
  return persona?.id || estudiante?.persona || null;
};

const getNombreCompleto = (estudiante) => {
  const persona = getPersona(estudiante);
  const nombre = estudiante?.nombre || persona?.nombre || '';
  const primerApellido = estudiante?.primer_apellido || persona?.primer_apellido || '';
  const segundoApellido = estudiante?.segundo_apellido || persona?.segundo_apellido || '';
  return `${nombre} ${primerApellido} ${segundoApellido}`.trim() || 'Sin nombre';
};

const getGrupoActual = (estudiante) => estudiante?.grupo_actual || null;

export default function GrupoEstudiantes() {
  const navigate = useNavigate();
  const { grupoId } = useParams();

  const [grupo, setGrupo] = useState(null);
  const [estudiantesGrupo, setEstudiantesGrupo] = useState([]);
  const [estudiantesDisponibles, setEstudiantesDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, estudiante: null });

  const loadData = async () => {
    if (!grupoId) return;

    setLoading(true);
    setErrorMessage('');
    try {
      const [grupoData, grupoEstudiantesData, todosEstudiantesData] = await Promise.all([
        fetchGrupoDetail(grupoId),
        fetchEstudiantesGrupo(grupoId),
        fetchEstudiantesUsuarios(),
      ]);

      const grupoList = Array.isArray(grupoEstudiantesData) ? grupoEstudiantesData : grupoEstudiantesData?.results || [];
      const todosList = Array.isArray(todosEstudiantesData) ? todosEstudiantesData : todosEstudiantesData?.results || [];

      const grupoIds = new Set(
        grupoList
          .map((estudiante) => getPersonaId(estudiante))
          .filter(Boolean)
          .map(String)
      );

      setGrupo(grupoData);
      setEstudiantesGrupo(grupoList);
      setEstudiantesDisponibles(
        todosList.filter((estudiante) => {
          const personaId = getPersonaId(estudiante);
          if (!personaId) return false;
          return !grupoIds.has(String(personaId));
        })
      );
    } catch (error) {
      setErrorMessage('No se pudo cargar la información del grupo.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [grupoId]);

  const filteredGrupo = useMemo(() => {
    if (!searchValue.trim()) return estudiantesGrupo;
    const term = searchValue.toLowerCase().trim();
    return estudiantesGrupo.filter((estudiante) => {
      const nombre = getNombreCompleto(estudiante).toLowerCase();
      const identificacion = String(getPersona(estudiante)?.identificacion || '').toLowerCase();
      const codigo = String(estudiante?.codigo_estudiante || '').toLowerCase();
      return nombre.includes(term) || identificacion.includes(term) || codigo.includes(term);
    });
  }, [estudiantesGrupo, searchValue]);

  const filteredDisponibles = useMemo(() => {
    if (!searchValue.trim()) return estudiantesDisponibles;
    const term = searchValue.toLowerCase().trim();
    return estudiantesDisponibles.filter((estudiante) => {
      const nombre = getNombreCompleto(estudiante).toLowerCase();
      const identificacion = String(getPersona(estudiante)?.identificacion || '').toLowerCase();
      const codigo = String(estudiante?.codigo_estudiante || '').toLowerCase();
      const grupoActual = String(getGrupoActual(estudiante)?.nombre || '').toLowerCase();
      return (
        nombre.includes(term) ||
        identificacion.includes(term) ||
        codigo.includes(term) ||
        grupoActual.includes(term)
      );
    });
  }, [estudiantesDisponibles, searchValue]);

  const handleAssign = async (estudiante) => {
    const personaId = getPersonaId(estudiante);
    if (!personaId) return;

    setProcessingId(personaId);
    setErrorMessage('');
    try {
      const grupoActual = getGrupoActual(estudiante);
      if (grupoActual?.id && String(grupoActual.id) !== String(grupoId)) {
        await removerEstudianteGrupo(grupoActual.id, personaId);
      }

      await asignarEstudianteGrupo(grupoId, personaId);
      setSuccessMessage('Estudiante asignado al grupo correctamente.');
      setTimeout(() => setSuccessMessage(''), 3000);
      await loadData();
    } catch (error) {
      setErrorMessage('No fue posible asignar al estudiante.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemove = async () => {
    const estudiante = confirmModal.estudiante;
    const personaId = getPersonaId(estudiante);
    if (!personaId) return;

    setProcessingId(personaId);
    try {
      await removerEstudianteGrupo(grupoId, personaId);
      setSuccessMessage('Estudiante removido del grupo correctamente.');
      setTimeout(() => setSuccessMessage(''), 3000);
      setConfirmModal({ open: false, estudiante: null });
      await loadData();
    } catch (error) {
      setErrorMessage('No fue posible remover al estudiante.');
      setTimeout(() => setErrorMessage(''), 4000);
      setConfirmModal({ open: false, estudiante: null });
    } finally {
      setProcessingId(null);
    }
  };

  const currentColumns = [
    {
      key: 'estudiante',
      label: 'Estudiante',
      render: (row) => {
        const persona = getPersona(row);
        return (
          <div>
            <div className="font-medium text-slate-900">{getNombreCompleto(row)}</div>
            <div className="text-xs text-slate-500">{persona?.identificacion || 'Sin identificación'}</div>
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
            onClick={() => setConfirmModal({ open: true, estudiante: row })}
            className="rounded-md bg-[#0b2545] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#185fa5] disabled:opacity-60"
            disabled={processingId === getPersonaId(row)}
          >
            <span className="inline-flex items-center gap-1">
              <UserMinus className="h-3.5 w-3.5" />
              Quitar
            </span>
          </button>
        </div>
      ),
    },
  ];

  const availableColumns = [
    {
      key: 'estudiante',
      label: 'Estudiante',
      render: (row) => {
        const persona = getPersona(row);
        return (
          <div>
            <div className="font-medium text-slate-900">{getNombreCompleto(row)}</div>
            <div className="text-xs text-slate-500">{persona?.identificacion || 'Sin identificación'}</div>
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
        const grupoActual = getGrupoActual(row);
        if (!grupoActual) return <span className="text-slate-500">Sin grupo</span>;
        return <span className="text-slate-600">{grupoActual.nombre} ({grupoActual.grado || 'Sin grado'})</span>;
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
      render: (row) => {
        const personaId = getPersonaId(row);
        const grupoActual = getGrupoActual(row);
        const isInAnotherGroup = Boolean(grupoActual?.id && String(grupoActual.id) !== String(grupoId));
        return (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => handleAssign(row)}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
              disabled={processingId === personaId}
            >
              <span className="inline-flex items-center gap-1">
                {isInAnotherGroup ? <ArrowRightLeft className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                {isInAnotherGroup ? 'Mover aquí' : 'Asignar'}
              </span>
            </button>
          </div>
        );
      },
    },
  ];

  if (!grupoId) {
    return (
      <EmptyState
        title="Grupo no encontrado"
        message="No se pudo determinar el grupo a gestionar."
        action={{ label: 'Volver a grupos', onClick: () => navigate('/usuarios/grados-grupos') }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={grupo ? `Grupo ${grupo.nombre}` : 'Gestión de estudiantes'}
        subtitle={
          grupo
            ? `${grupo.grado_nombre || 'Sin grado'} • ${grupo.docente_guia_nombre || 'Sin docente guía'} • ${grupo.aula || 'Sin aula'}`
            : 'Gestiona los estudiantes asignados al grupo'
        }
        action={{
          label: 'Volver a Grupos',
          onClick: () => navigate('/usuarios/grados-grupos'),
          icon: <ArrowLeft className="h-4 w-4" />,
        }}
      />

      <SearchFilter
        value={searchValue}
        onChange={setSearchValue}
        placeholder="Buscar por nombre, cédula o código..."
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#185fa5]" />
        </div>
      ) : null}

      {!loading && grupo ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Estudiantes del grupo</h2>
                <p className="text-sm text-slate-600">{filteredGrupo.length} estudiante(s) asignado(s)</p>
              </div>
              <div className="rounded-full bg-[#e6f1fb] px-3 py-1 text-xs font-semibold text-[#185fa5] inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                Grupo activo
              </div>
            </div>
            <DataTable
              columns={currentColumns}
              data={filteredGrupo}
              loading={loading}
              emptyMessage="Este grupo aún no tiene estudiantes asignados"
            />
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Estudiantes disponibles</h2>
              <p className="text-sm text-slate-600">{filteredDisponibles.length} estudiante(s) disponibles para asignar o mover</p>
            </div>
            <DataTable
              columns={availableColumns}
              data={filteredDisponibles}
              loading={loading}
              emptyMessage="No hay estudiantes disponibles para asignar"
            />
          </section>
        </div>
      ) : null}

      <ConfirmModal
        open={confirmModal.open}
        title="Quitar estudiante del grupo"
        message="El estudiante se removerá de este grupo y quedará disponible para asignarlo a otro."
        variant="warning"
        confirmLabel="Quitar"
        onConfirm={handleRemove}
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
