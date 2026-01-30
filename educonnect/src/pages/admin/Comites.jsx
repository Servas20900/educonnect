import { useEffect, useMemo, useState } from 'react';
import {
    addMiembro,
    createComite,
    deleteComite,
    fetchComites,
    fetchPersonasDisponibles,
    updateComite
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
                            {editingId ? 'Agregar Miembros al Comité' : 'Agregar Miembros'}
                        </label>
                        <select
                            id="miembros"
                            multiple
                            value={selectedPersonas}
                            onChange={(e) =>
                                setSelectedPersonas(
                                    Array.from(e.target.selectedOptions, (option) => Number(option.value))
                                )
                            }
                            className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md shadow-sm h-28"
                        >
                            {personasOptions.map((persona) => (
                                <option key={persona.id} value={persona.id}>
                                    {persona.label}
                                </option>
                            ))}
                        </select>
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
                                <tr key={comite.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {comite.nombre}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {comite.tipo_comite}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {comite.total_miembros ?? comite.total_miembros_activos ?? 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {comite.estado}
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