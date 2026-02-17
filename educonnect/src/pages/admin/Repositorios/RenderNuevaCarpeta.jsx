import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RenderNuevaCarpeta({ nuevoRepositorio, onSuccess }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        nombre: "",
        descripcion: "",
        rol_acceso: "Administrador",
        cloudinary_path: "educonnect/documentos/"
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const result = await nuevoRepositorio(formData);
        
        if (result.success) {
            onSuccess();
        } else {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 bg-white rounded-3xl max-w-lg w-full shadow-2xl">
            <div className="mb-8">
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                    Nueva Carpeta
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    Configuración de repositorio y storage
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                            Nombre del Repositorio
                        </label>
                        <input 
                            name="nombre"
                            className="w-full rounded-2xl border-none bg-gray-50 p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                            type="text"
                            placeholder="Ej: Actas de Consejo 2026"
                            required
                            value={formData.nombre}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                            Descripción Breve
                        </label>
                        <textarea 
                            name="descripcion"
                            className="w-full rounded-2xl border-none bg-gray-50 p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                            placeholder="¿Qué tipo de archivos se guardarán aquí?"
                            rows="2"
                            value={formData.descripcion}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                            Ruta de Almacenamiento
                        </label>
                        <input 
                            name="cloudinary_path"
                            className="w-full rounded-2xl border-none bg-gray-100 p-4 text-sm font-mono text-gray-500"
                            type="text"
                            value={formData.cloudinary_path}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                            Nivel de Acceso Requerido
                        </label>
                        <select 
                            name="rol_acceso"
                            className="w-full rounded-2xl border-none bg-gray-50 p-4 text-sm font-black uppercase appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                            value={formData.rol_acceso}
                            onChange={handleChange}
                        >
                            <option value="Administrador">Administrador</option>
                            <option value="Docente">Docente</option>
                            <option value="Secretaría">Secretaría</option>
                            <option value="Estudiante">Estudiante</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button 
                        type="button" 
                        onClick={onSuccess} 
                        className="flex-1 px-4 py-4 bg-gray-100 text-gray-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`flex-1 px-4 py-4 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 ${
                            loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700'
                        }`}
                    >
                        {loading ? "Creando..." : "Crear Carpeta"}
                    </button>
                </div>
            </form>
        </div>
    );
}