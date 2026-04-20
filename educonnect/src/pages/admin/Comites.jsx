import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import {
    addMiembro,
    archiveComite,
    createComite,
    fetchComites,
    fetchDocentesDisponibles,
    removeMiembro,
    unarchiveComite,
    updateComite,
    updateMiembro
} from '../../api/comitesService';
import {
    DataTable,
    FormModal,
    PageHeader,
    SearchFilter,
    StatusBadge,
    Paginador,
} from '../../components/ui';
import useSystemConfig from '../../hooks/useSystemConfig';

const defaultForm = {
    nombre: '',
    descripcion: '',
    objetivos: '',
    tipo_comite: 'institucional',
    estado: 'activo',
    reglamento: ''
};

const DEFAULT_ROLES = [
    { value: 'Presidente', label: 'Presidente' },
    { value: 'Secretario', label: 'Secretario' },
    { value: 'Tesorero', label: 'Tesorero' },
    { value: 'Vocal', label: 'Vocal' },
    { value: 'Miembro', label: 'Miembro' },
];

const formatErrorMessage = (error) => {
    if (!error) return 'Ocurrió un error inesperado';
    if (typeof error === 'string') return error;

    if (typeof error?.detail === 'string' && error.detail.trim()) {
        return error.detail;
    }

    if (typeof error?.error === 'string' && error.error.trim()) {
        return error.error;
    }

    if (error?.non_field_errors?.length) {
        return error.non_field_errors[0];
    }

    if (error && typeof error === 'object') {
        const firstEntry = Object.entries(error)[0];
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

const toOptionList = (items, fallback) => {
    if (!Array.isArray(items) || items.length === 0) return fallback;
    return items;
};

export default function Comites() {
    const { getCatalog } = useSystemConfig();
    const tiposComite = toOptionList(getCatalog('comites_tipos', [
        { value: 'institucional', label: 'Institucional' },
        { value: 'disciplinario', label: 'Disciplinario' },
    ]), [
        { value: 'institucional', label: 'Institucional' },
        { value: 'disciplinario', label: 'Disciplinario' },
    ]);
    const estadosComite = toOptionList(getCatalog('comites_estados', [
        { value: 'activo', label: 'Activo' },
        { value: 'inactivo', label: 'Inactivo' },
    ]), [
        { value: 'activo', label: 'Activo' },
        { value: 'inactivo', label: 'Inactivo' },
    ]);
    const rolesComite = toOptionList(getCatalog('comites_roles_disponibles', DEFAULT_ROLES), DEFAULT_ROLES);

    const [comites, setComites] = useState([]);
    const [docentes, setDocentes] = useState([]);
    const [selectedDocentes, setSelectedDocentes] = useState([]);
    const [form, setForm] = useState(defaultForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expandedComite, setExpandedComite] = useState(null);
    const [miembroRoles, setMiembroRoles] = useState({});
    const [savingMiembroId, setSavingMiembroId] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [viewMode, setViewMode] = useState('activos');
    const [successMessage, setSuccessMessage] = useState('');
    const [editingMembers, setEditingMembers] = useState([]);
    const [newMemberPersonaId, setNewMemberPersonaId] = useState('');

    const docentesOptions = useMemo(() => {
        return docentes.map((p) => ({
            id: p.id,
            label: p.nombre_completo || `${p.nombre} ${p.primer_apellido}`,
            email: p.email_institucional || '',
        }));
    }, [docentes]);

    const comitesFiltrados = useMemo(() => {
        const query = searchValue.trim().toLowerCase();
        return comites.filter((comite) => {
            const matchesSearch = !query || [
                comite.nombre,
                comite.descripcion,
                comite.tipo_comite,
            ].some((value) => String(value || '').toLowerCase().includes(query));

            const matchesTipo = !filtroTipo || comite.tipo_comite === filtroTipo;

            return matchesSearch && matchesTipo;
        });
    }, [comites, searchValue, filtroTipo]);

    const comitesActivos = useMemo(
        () => comitesFiltrados.filter((comite) => comite.estado === 'activo'),
        [comitesFiltrados]
    );

    const comitesArchivados = useMemo(
        () => comitesFiltrados.filter((comite) => comite.estado !== 'activo'),
        [comitesFiltrados]
    );

    const comitesEnVista = viewMode === 'archivados' ? comitesArchivados : comitesActivos;

    const docentesDisponiblesParaEditar = useMemo(() => {
        if (!editingId) return [];
        const personaIds = new Set(editingMembers.map((member) => Number(member.personaId)));
        return docentesOptions.filter((docente) => !personaIds.has(Number(docente.id)));
    }, [editingId, editingMembers, docentesOptions]);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [comitesData, personasData] = await Promise.all([
                fetchComites(),
                fetchDocentesDisponibles()
            ]);

            const comitesList = Array.isArray(comitesData) ? comitesData : comitesData.results || [];
            const personasList = Array.isArray(personasData) ? personasData : personasData.results || [];

            setComites(comitesList);
            setDocentes(personasList);
        } catch (err) {
            setError(formatErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (!expandedComite) {
            setMiembroRoles({});
            return;
        }

        const comite = comites.find((item) => item.id === expandedComite);
        if (!comite?.miembros) return;

        const initialRoles = {};
        comite.miembros.forEach((miembro) => {
            initialRoles[miembro.id] = miembro.cargo || 'Miembro';
        });
        setMiembroRoles(initialRoles);
    }, [expandedComite, comites]);

    const resetForm = () => {
        setForm(defaultForm);
        setSelectedDocentes([]);
        setEditingId(null);
        setEditingMembers([]);
        setNewMemberPersonaId('');
    };

    const toggleSelectedDocente = (personaId) => {
        setSelectedDocentes((prev) => (
            prev.some((item) => item.personaId === personaId)
                ? prev.filter((item) => item.personaId !== personaId)
                : [...prev, { personaId, cargo: 'Miembro' }]
        ));
    };

    const updateSelectedDocenteCargo = (personaId, cargo) => {
        setSelectedDocentes((prev) => prev.map((item) => (
            item.personaId === personaId ? { ...item, cargo } : item
        )));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const today = new Date().toISOString().slice(0, 10);
            if (editingId) {
                await updateComite(editingId, form);

                const comiteOriginal = comites.find((item) => item.id === editingId);
                const miembrosOriginales = comiteOriginal?.miembros || [];
                const miembrosOriginalesMap = new Map(miembrosOriginales.map((m) => [m.id, m]));
                const idsRetenidos = new Set(
                    editingMembers.filter((member) => !member.isNew && member.id).map((member) => member.id)
                );

                const removerPromises = miembrosOriginales
                    .filter((miembro) => !idsRetenidos.has(miembro.id))
                    .map((miembro) => removeMiembro(editingId, miembro.id));

                const actualizarPromises = editingMembers
                    .filter((member) => !member.isNew && member.id)
                    .filter((member) => {
                        const original = miembrosOriginalesMap.get(member.id);
                        return original && (original.cargo || 'Miembro') !== member.cargo;
                    })
                    .map((member) =>
                        updateMiembro(editingId, {
                            miembro_id: member.id,
                            cargo: member.cargo,
                            activo: true,
                        })
                    );

                const agregarPromises = editingMembers
                    .filter((member) => member.isNew && member.personaId)
                    .map((member) =>
                        addMiembro(editingId, {
                            persona_id: member.personaId,
                            cargo: member.cargo,
                            fecha_nombramiento: today,
                        })
                    );

                await Promise.all([...removerPromises, ...actualizarPromises, ...agregarPromises]);
            } else {
                const payload = {
                    ...form,
                    miembros: selectedDocentes.map(({ personaId, cargo }) => ({
                        persona_id: personaId,
                        cargo,
                        fecha_nombramiento: today
                    }))
                };
                await createComite(payload);
            }

            await loadData();
            resetForm();
            setFormOpen(false);
            setSuccessMessage(editingId ? 'Comité actualizado correctamente' : 'Comité creado correctamente');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(formatErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (comite) => {
        setEditingId(comite.id);
        setForm({
            nombre: comite.nombre || '',
            descripcion: comite.descripcion || '',
            objetivos: comite.objetivos || '',
            tipo_comite: comite.tipo_comite || 'institucional',
            estado: comite.estado || 'activo',
            reglamento: comite.reglamento || ''
        });
        setEditingMembers((comite.miembros || []).map((miembro) => ({
            id: miembro.id,
            personaId: miembro.persona_info?.id || miembro.persona || miembro.persona_id,
            nombre: miembro.persona_info?.nombre_completo || 'Sin nombre',
            email: miembro.persona_info?.email_institucional || '',
            cargo: miembro.cargo || 'Miembro',
            isNew: false,
        })));
        setNewMemberPersonaId('');
        setFormOpen(true);
    };

    const handleNewComite = () => {
        resetForm();
        setFormOpen(true);
    };

    const handleToggleArchive = async (comite) => {
        setLoading(true);
        setError('');
        try {
            if (comite.estado === 'activo') {
                await archiveComite(comite.id);
                setSuccessMessage('Comité archivado correctamente');
            } else {
                await unarchiveComite(comite.id);
                setSuccessMessage('Comité desarchivado correctamente');
            }
            await loadData();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(formatErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleToggleExpanded = (comiteId) => {
        setExpandedComite((current) => (current === comiteId ? null : comiteId));
    };

    const handleMemberRoleChange = (miembroId, cargo) => {
        setMiembroRoles((prev) => ({
            ...prev,
            [miembroId]: cargo
        }));
    };

    const handleSaveMiembro = async (comiteId, miembro) => {
        setSavingMiembroId(miembro.id);
        setError('');
        try {
            await updateMiembro(comiteId, {
                miembro_id: miembro.id,
                cargo: miembroRoles[miembro.id] || miembro.cargo || 'Miembro',
                activo: miembro.activo
            });
            await loadData();
            setSuccessMessage('Integrante actualizado correctamente');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(formatErrorMessage(err));
        } finally {
            setSavingMiembroId(null);
        }
    };

    const handleRemoveMiembro = async (comiteId, miembroId) => {
        if (!window.confirm('¿Seguro que deseas remover este integrante del comité?')) return;
        setSavingMiembroId(miembroId);
        setError('');
        try {
            await removeMiembro(comiteId, miembroId);
            await loadData();
            setSuccessMessage('Integrante removido correctamente');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(formatErrorMessage(err));
        } finally {
            setSavingMiembroId(null);
        }
    };

    const handleEditMemberRoleChange = (memberId, cargo) => {
        setEditingMembers((prev) => prev.map((member) => (
            member.id === memberId ? { ...member, cargo } : member
        )));
    };

    const handleRemoveEditMember = (memberId) => {
        setEditingMembers((prev) => prev.filter((member) => member.id !== memberId));
    };

    const handleAddEditMember = () => {
        const personaId = Number(newMemberPersonaId);
        if (!personaId) return;
        const docente = docentesOptions.find((item) => Number(item.id) === personaId);
        if (!docente) return;

        setEditingMembers((prev) => [
            ...prev,
            {
                id: `new-${personaId}-${Date.now()}`,
                personaId,
                nombre: docente.label,
                email: docente.email,
                cargo: 'Miembro',
                isNew: true,
            }
        ]);
        setNewMemberPersonaId('');
    };

    const tableColumns = [
        {
            key: 'nombre',
            label: 'Nombre',
            render: (row) => <div className="font-medium text-slate-900">{row.nombre}</div>,
        },
        {
            key: 'tipo_comite',
            label: 'Tipo',
            render: (row) => <span className="text-slate-600">{row.tipo_comite}</span>,
        },
        {
            key: 'miembros',
            label: 'Miembros',
            render: (row) => (
                <button
                    type="button"
                    onClick={() => handleToggleExpanded(row.id)}
                    className="font-medium text-[#185fa5] hover:underline"
                >
                    {(row.total_miembros ?? row.total_miembros_activos ?? row.miembros?.length ?? 0)} integrantes
                </button>
            ),
        },
        {
            key: 'estado',
            label: 'Estado',
            render: (row) => <StatusBadge status={row.estado} size="sm" />,
        },
        {
            key: 'acciones',
            label: 'Acciones',
            render: (row) => (
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => handleEdit(row)}
                        className="rounded-md bg-[#185fa5] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#0c447c]"
                    >
                        Editar
                    </button>
                    <button
                        type="button"
                        onClick={() => handleToggleArchive(row)}
                        className="rounded-md bg-[#185fa5] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#0c447c]"
                    >
                        {row.estado === 'activo' ? 'Archivar' : 'Desarchivar'}
                    </button>
                </div>
            ),
        },
    ];

    const selectedCommittee = comites.find((item) => item.id === expandedComite);

    return (
        <div className="space-y-6 p-6">
            <PageHeader
                title="Comités"
                subtitle="Administra la composición de comités y asigna roles únicamente a docentes institucionales"
                action={{
                    label: 'Nuevo Comité',
                    onClick: handleNewComite,
                    icon: <Plus className="h-4 w-4" />,
                }}
            />

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <SearchFilter
                value={searchValue}
                onChange={setSearchValue}
                placeholder="Buscar por nombre, tipo o descripción..."
                filters={[
                    {
                        key: 'tipo',
                        label: 'Tipo',
                        options: tiposComite,
                    },
                ]}
                onFilterChange={({ key, value }) => {
                    if (key === 'tipo') setFiltroTipo(value);
                }}
            />

            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => setViewMode('activos')}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        viewMode === 'activos'
                            ? 'bg-[#185fa5] text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                    Activos ({comitesActivos.length})
                </button>
                <button
                    type="button"
                    onClick={() => setViewMode('archivados')}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        viewMode === 'archivados'
                            ? 'bg-[#185fa5] text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                    Archivados ({comitesArchivados.length})
                </button>
            </div>

            <DataTable
                columns={tableColumns}
                data={comitesEnVista}
                loading={loading}
                emptyMessage={
                    searchValue || filtroTipo
                        ? 'No se encontraron comités con ese criterio'
                        : viewMode === 'archivados'
                            ? 'No hay comités archivados'
                            : 'No hay comités activos registrados'
                }
                emptyAction={{
                    label: 'Nuevo Comité',
                    onClick: handleNewComite,
                }}
            />

            {selectedCommittee ? (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">{selectedCommittee.nombre}</h2>
                            <p className="text-sm text-slate-500">Integrantes activos y rol asignado por administración.</p>
                        </div>
                        <StatusBadge status={selectedCommittee.estado} size="sm" />
                    </div>

                    <Paginador items={selectedCommittee.miembros || []} itemsPorPagina={6}>
                        {(itemsPaginados) => (
                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3">Integrante</th>
                                            <th className="px-4 py-3">Correo institucional</th>
                                            <th className="px-4 py-3">Rol</th>
                                            <th className="px-4 py-3">Estado</th>
                                            <th className="px-4 py-3 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {itemsPaginados.length > 0 ? (
                                            itemsPaginados.map((miembro) => (
                                                <tr key={miembro.id} className="hover:bg-[#e6f1fb]">
                                                    <td className="px-4 py-3 font-medium text-slate-900">
                                                        {miembro.persona_info?.nombre_completo || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                        {miembro.persona_info?.email_institucional || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <select
                                                            value={miembroRoles[miembro.id] || miembro.cargo || 'Miembro'}
                                                            onChange={(event) => handleMemberRoleChange(miembro.id, event.target.value)}
                                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
                                                        >
                                                            {rolesComite.map((rol) => (
                                                                <option key={rol.value} value={rol.value}>
                                                                    {rol.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <StatusBadge status={miembro.activo ? 'Activo' : 'Inactivo'} size="sm" />
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="inline-flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSaveMiembro(selectedCommittee.id, miembro)}
                                                                disabled={savingMiembroId === miembro.id}
                                                                className="rounded-md bg-[#185fa5] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#0c447c] disabled:opacity-60"
                                                            >
                                                                Guardar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveMiembro(selectedCommittee.id, miembro.id)}
                                                                disabled={savingMiembroId === miembro.id}
                                                                className="rounded-md bg-[#0b2545] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#081a31] disabled:opacity-60"
                                                            >
                                                                Remover
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                                                    Este comité aún no tiene integrantes activos.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Paginador>
                </section>
            ) : null}

            <FormModal
                open={formOpen}
                title={editingId ? 'Editar comité' : 'Nuevo comité'}
                onClose={() => {
                    setFormOpen(false);
                    resetForm();
                }}
                onSubmit={handleSubmit}
                loading={loading}
                submitLabel={editingId ? 'Guardar cambios' : 'Crear comité'}
                maxWidth="lg"
            >
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Nombre del comité"
                        value={form.nombre}
                        onChange={(event) => setForm({ ...form, nombre: event.target.value })}
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
                        required
                    />

                    <textarea
                        rows="3"
                        placeholder="Descripción y propósito del comité"
                        value={form.descripcion}
                        onChange={(event) => setForm({ ...form, descripcion: event.target.value })}
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
                        required
                    />

                    <textarea
                        rows="3"
                        placeholder="Objetivos"
                        value={form.objetivos}
                        onChange={(event) => setForm({ ...form, objetivos: event.target.value })}
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
                    />

                    <textarea
                        rows="2"
                        placeholder="Reglamento o lineamientos"
                        value={form.reglamento}
                        onChange={(event) => setForm({ ...form, reglamento: event.target.value })}
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
                    />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label className="space-y-1 text-sm">
                            <span className="block font-medium text-slate-700">Tipo</span>
                            <select
                                value={form.tipo_comite}
                                onChange={(event) => setForm({ ...form, tipo_comite: event.target.value })}
                                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
                            >
                                {tiposComite.map((tipo) => (
                                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                                ))}
                            </select>
                        </label>
                        <label className="space-y-1 text-sm">
                            <span className="block font-medium text-slate-700">Estado</span>
                            <select
                                value={form.estado}
                                onChange={(event) => setForm({ ...form, estado: event.target.value })}
                                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
                            >
                                {estadosComite.map((estado) => (
                                    <option key={estado.value} value={estado.value}>{estado.label}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {!editingId ? (
                        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Docentes iniciales</h3>
                                <p className="text-xs text-slate-500">Solo docentes con correo institucional @mep.go.cr.</p>
                            </div>
                            <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
                                {docentesOptions.map((docente) => {
                                    const selected = selectedDocentes.find((item) => item.personaId === docente.id);
                                    return (
                                        <div key={docente.id} className="rounded-lg border border-transparent px-3 py-2 hover:border-slate-200 hover:bg-slate-50">
                                            <label className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(selected)}
                                                    onChange={() => toggleSelectedDocente(docente.id)}
                                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#185fa5]"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-medium text-slate-900">{docente.label}</div>
                                                    <div className="text-xs text-slate-500">{docente.email_institucional || 'Sin correo institucional'}</div>
                                                    {selected ? (
                                                        <div className="mt-2 max-w-xs">
                                                            <select
                                                                value={selected.cargo}
                                                                onChange={(event) => updateSelectedDocenteCargo(docente.id, event.target.value)}
                                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
                                                            >
                                                                {rolesComite.map((rol) => (
                                                                    <option key={rol.value} value={rol.value}>{rol.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </label>
                                        </div>
                                    );
                                })}
                                {docentesOptions.length === 0 ? (
                                    <p className="px-3 py-4 text-sm text-slate-500">No hay docentes disponibles.</p>
                                ) : null}
                            </div>
                            {selectedDocentes.length > 0 ? (
                                <p className="text-sm text-[#185fa5]">{selectedDocentes.length} docente(s) seleccionados.</p>
                            ) : null}
                        </div>
                    ) : (
                        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Integrantes del comité</h3>
                                <p className="text-xs text-slate-500">Aquí puedes quitar, agregar y cambiar el rol interno de cada integrante.</p>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <tr>
                                            <th className="px-3 py-2">Docente</th>
                                            <th className="px-3 py-2">Correo</th>
                                            <th className="px-3 py-2">Rol</th>
                                            <th className="px-3 py-2 text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {editingMembers.length > 0 ? (
                                            editingMembers.map((member) => (
                                                <tr key={member.id}>
                                                    <td className="px-3 py-2 font-medium text-slate-900">{member.nombre}</td>
                                                    <td className="px-3 py-2 text-slate-600">{member.email || 'Sin correo institucional'}</td>
                                                    <td className="px-3 py-2">
                                                        <select
                                                            value={member.cargo}
                                                            onChange={(event) => handleEditMemberRoleChange(member.id, event.target.value)}
                                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
                                                        >
                                                            {rolesComite.map((rol) => (
                                                                <option key={rol.value} value={rol.value}>{rol.label}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveEditMember(member.id)}
                                                            className="rounded-md bg-[#0b2545] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#081a31]"
                                                        >
                                                            Quitar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="px-3 py-6 text-center text-slate-500">
                                                    Este comité no tiene integrantes.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                                <select
                                    value={newMemberPersonaId}
                                    onChange={(event) => setNewMemberPersonaId(event.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
                                >
                                    <option value="">Selecciona un docente para agregar</option>
                                    {docentesDisponiblesParaEditar.map((docente) => (
                                        <option key={docente.id} value={docente.id}>
                                            {docente.label}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={handleAddEditMember}
                                    disabled={!newMemberPersonaId}
                                    className="rounded-md bg-[#185fa5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0c447c] disabled:opacity-60"
                                >
                                    Agregar integrante
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </FormModal>

            {successMessage ? (
                <div className="fixed bottom-4 right-4 z-[1300] rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-lg">
                    {successMessage}
                </div>
            ) : null}
        </div>
    );
}