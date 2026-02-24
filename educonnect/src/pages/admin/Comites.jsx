import { Fragment, useEffect, useMemo, useState } from 'react';
import {
    addMiembro,
    createComite,
    deleteComite,
    fetchComites,
    fetchPersonasDisponibles,
    removeMiembro,
    updateComite,
    updateMiembro
} from '../../api/comitesService';

const tiposComite = [
    { value: 'institucional', label: 'Institucional' },
    { value: 'disciplinario', label: 'Disciplinario' },
    { value: 'evaluacion', label: 'Evaluación' },
    { value: 'apoyo', label: 'Apoyo' },
    { value: 'especial', label: 'Especial' }
];

const estadosComite = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
    { value: 'disuelto', label: 'Disuelto' }
];

const defaultForm = {
    nombre: '',
    descripcion: '',
    objetivos: '',
    tipo_comite: 'institucional',
    estado: 'activo',
    reglamento: ''
};

export default function Comites() {
    const [comites, setComites] = useState([]);
    const [personas, setPersonas] = useState([]);
    const [selectedPersonas, setSelectedPersonas] = useState([]);
    const [form, setForm] = useState(defaultForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expandedComite, setExpandedComite] = useState(null);
    const [editingMiembroId, setEditingMiembroId] = useState(null);
    const [miembroDraft, setMiembroDraft] = useState({ cargo: 'Miembro', activo: true });
    const [savingMiembroId, setSavingMiembroId] = useState(null);

    const personasOptions = useMemo(() => {
        return personas.map((p) => ({
            id: p.id,
            label: p.nombre_completo || `${p.nombre} ${p.primer_apellido}`
        }));
    }, [personas]);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [comitesData, personasData] = await Promise.all([
                fetchComites(),
                fetchPersonasDisponibles()
            ]);

            const comitesList = Array.isArray(comitesData) ? comitesData : comitesData.results || [];
            const personasList = Array.isArray(personasData) ? personasData : personasData.results || [];

            setComites(comitesList);
            setPersonas(personasList);
        } catch (err) {
            setError('No se pudo cargar la información de comités.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const resetForm = () => {
        setForm(defaultForm);
        setSelectedPersonas([]);
        setEditingId(null);
    };

    const toggleSelectedPersona = (personaId) => {
        setSelectedPersonas((prev) => (
            prev.includes(personaId)
                ? prev.filter((id) => id !== personaId)
                : [...prev, personaId]
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (editingId) {
                await updateComite(editingId, form);

                if (selectedPersonas.length > 0) {
                    const today = new Date().toISOString().slice(0, 10);
                    await Promise.all(
                        selectedPersonas.map((personaId) =>
                            addMiembro(editingId, {
                                persona_id: personaId,
                                cargo: 'Miembro',
                                fecha_nombramiento: today
                            })
                        )
                    );
                }
            } else {
                const today = new Date().toISOString().slice(0, 10);
                const payload = {
                    ...form,
                    miembros: selectedPersonas.map((personaId) => ({
                        persona_id: personaId,
                        cargo: 'Miembro',
                        fecha_nombramiento: today
                    }))
                };
                await createComite(payload);
            }

            await loadData();
            resetForm();
        } catch (err) {
            setError('No se pudo guardar el comité. Verifica los datos.');
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
        setSelectedPersonas([]);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este comité?')) return;
        setLoading(true);
        setError('');
        try {
            await deleteComite(id);
            await loadData();
        } catch (err) {
            setError('No se pudo eliminar el comité.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditMiembro = (miembro) => {
        setEditingMiembroId(miembro.id);
        setMiembroDraft({
            cargo: miembro.cargo || 'Miembro',
            activo: !!miembro.activo
        });
    };

    const handleCancelMiembro = () => {
        setEditingMiembroId(null);
        setMiembroDraft({ cargo: 'Miembro', activo: true });
    };

    const handleSaveMiembro = async (comiteId, miembroId) => {
        setSavingMiembroId(miembroId);
        setError('');
        try {
            await updateMiembro(comiteId, {
                miembro_id: miembroId,
                cargo: miembroDraft.cargo,
                activo: miembroDraft.activo
            });
            await loadData();
            handleCancelMiembro();
        } catch (err) {
            setError('No se pudo actualizar el miembro del comité.');
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
            if (editingMiembroId === miembroId) {
                handleCancelMiembro();
            }
        } catch (err) {
            setError('No se pudo remover el miembro del comité.');
        } finally {
            setSavingMiembroId(null);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-700 mb-8 border-b pb-2">
                Creación y Gestión de Comités
            </h1>

            {error && (
                <div className="mb-6 p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
                    {error}
                </div>
            )}

            <section className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                    {editingId ? 'Editar Comité' : 'Crear Nuevo Comité'}
                </h2>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Nombre del Comité"
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        className="block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-teal-500 focus:border-teal-500"
                        required
                    />

                    <textarea
                        rows="3"
                        placeholder="Definir descripción y propósito del comité..."
                        value={form.descripcion}
                        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                        className="block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-teal-500 focus:border-teal-500"
                        required
                    />

                    <textarea
                        rows="3"
                        placeholder="Objetivos del comité..."
                        value={form.objetivos}
                        onChange={(e) => setForm({ ...form, objetivos: e.target.value })}
                        className="block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-teal-500 focus:border-teal-500"
                    />

                    <textarea
                        rows="2"
                        placeholder="Reglamento o lineamientos internos..."
                        value={form.reglamento}
                        onChange={(e) => setForm({ ...form, reglamento: e.target.value })}
                        className="block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-teal-500 focus:border-teal-500"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Comité</label>
                            <select
                                value={form.tipo_comite}
                                onChange={(e) => setForm({ ...form, tipo_comite: e.target.value })}
                                className="block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-teal-500 focus:border-teal-500"
                            >
                                {tiposComite.map((tipo) => (
                                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <select
                                value={form.estado}
                                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                                className="block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-teal-500 focus:border-teal-500"
                            >
                                {estadosComite.map((estado) => (
                                    <option key={estado.value} value={estado.value}>{estado.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="miembros" className="block text-sm font-medium text-gray-700 mb-1">
                            {editingId ? 'Agregar Miembros al Comité' : 'Seleccionar Miembros'}
                        </label>
                        <div className="mt-1 max-h-44 overflow-y-auto rounded-md border border-gray-200 p-2">
                            {personasOptions.map((persona) => {
                                const checked = selectedPersonas.includes(persona.id);
                                return (
                                    <label key={persona.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleSelectedPersona(persona.id)}
                                            className="h-4 w-4 text-teal-600 border-gray-300 rounded"
                                        />
                                        <span>{persona.label}</span>
                                    </label>
                                );
                            })}
                            {personasOptions.length === 0 && (
                                <p className="text-sm text-gray-500 px-2 py-1">No hay personas disponibles.</p>
                            )}
                        </div>
                        {selectedPersonas.length > 0 && (
                            <p className="mt-2 text-sm text-teal-600">
                                {selectedPersonas.length} {selectedPersonas.length === 1 ? 'miembro seleccionado' : 'miembros seleccionados'}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60"
                        >
                            {editingId ? 'Guardar Cambios' : 'Registrar Comité'}
                        </button>
                    </div>
                </form>
            </section>

            <section className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                    Listado de Comités
                </h2>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nombre
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Miembros
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {comites.map((comite) => (
                                <Fragment key={comite.id}>
                                    <tr key={comite.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {comite.nombre}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {comite.tipo_comite}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <button
                                                onClick={() => setExpandedComite(expandedComite === comite.id ? null : comite.id)}
                                                className="text-teal-600 hover:text-teal-900 font-medium"
                                            >
                                                {comite.total_miembros ?? comite.total_miembros_activos ?? 0} miembros
                                                <span className="ml-1">{expandedComite === comite.id ? '▼' : '▶'}</span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                comite.estado === 'activo' ? 'bg-green-100 text-green-800' :
                                                comite.estado === 'inactivo' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {comite.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                            <button
                                                onClick={() => handleEdit(comite)}
                                                className="text-teal-600 hover:text-teal-900"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(comite.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedComite === comite.id && comite.miembros && comite.miembros.length > 0 && (
                                        <tr key={`${comite.id}-miembros`}>
                                            <td colSpan="5" className="px-6 py-4 bg-gray-50">
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Integrantes del Comité:</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {comite.miembros.map((miembro) => (
                                                            <div key={miembro.id} className="flex items-center space-x-2 bg-white p-3 rounded-md border border-gray-200">
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium text-gray-900">
                                                                        {miembro.persona_info?.nombre_completo || 'N/A'}
                                                                    </p>
                                                                    {editingMiembroId === miembro.id ? (
                                                                        <div className="mt-1 flex flex-wrap items-center gap-2">
                                                                            <input
                                                                                type="text"
                                                                                value={miembroDraft.cargo}
                                                                                onChange={(e) => setMiembroDraft((prev) => ({ ...prev, cargo: e.target.value }))}
                                                                                className="border border-gray-300 rounded px-2 py-1 text-xs"
                                                                            />
                                                                            <label className="flex items-center gap-1 text-xs text-gray-600">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={miembroDraft.activo}
                                                                                    onChange={(e) => setMiembroDraft((prev) => ({ ...prev, activo: e.target.checked }))}
                                                                                    className="h-3 w-3"
                                                                                />
                                                                                Activo
                                                                            </label>
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-xs text-gray-500">{miembro.cargo || 'Miembro'}</p>
                                                                    )}
                                                                    <p className="text-xs text-gray-400">
                                                                        {miembro.persona_info?.email_institucional || miembro.persona_info?.email_personal}
                                                                    </p>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-1">
                                                                    {miembro.activo && (
                                                                        <span className="text-green-500 text-xs">●</span>
                                                                    )}
                                                                    {editingMiembroId === miembro.id ? (
                                                                        <div className="flex gap-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleSaveMiembro(comite.id, miembro.id)}
                                                                                disabled={savingMiembroId === miembro.id}
                                                                                className="text-xs text-teal-600 hover:text-teal-800"
                                                                            >
                                                                                Guardar
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={handleCancelMiembro}
                                                                                className="text-xs text-gray-600 hover:text-gray-800"
                                                                            >
                                                                                Cancelar
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex gap-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleEditMiembro(miembro)}
                                                                                className="text-xs text-teal-600 hover:text-teal-800"
                                                                            >
                                                                                Editar
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleRemoveMiembro(comite.id, miembro.id)}
                                                                                disabled={savingMiembroId === miembro.id}
                                                                                className="text-xs text-red-600 hover:text-red-800"
                                                                            >
                                                                                Remover
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                            {comites.length === 0 && !loading && (
                                <tr>
                                    <td className="px-6 py-6 text-center text-sm text-gray-500" colSpan="5">
                                        No hay comités registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}