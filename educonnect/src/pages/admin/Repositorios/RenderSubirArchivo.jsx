import { useState } from 'react';

export default function RenderSubirArchivo({ repositorio, subirArchivo, uploading, onSuccess }) {
    const [file, setFile] = useState(null);
    const [descripcion, setDescripcion] = useState("");
    const [errorLocal, setErrorLocal] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setErrorLocal(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!file) {
            setErrorLocal("Por favor, selecciona un archivo.");
            return;
        }
        const result = await subirArchivo(file, descripcion);

        if (result.success) {
            onSuccess();
        } else {
            setErrorLocal(result.error?.error || "Error al subir el archivo.");
        }
    };

    return (
        <div className="p-8 bg-white rounded-3xl max-w-lg w-full">
            <h3 className="text-xl font-black text-gray-900 uppercase mb-6">Subir a {repositorio?.nombre}</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-2 border-dashed border-gray-100 rounded-3xl p-10 text-center hover:bg-gray-50 transition-all relative">
                    <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                    <span className="text-4xl mb-2 block">📄</span>
                    <p className="text-sm font-bold text-gray-600">
                        {file ? file.name : "Seleccionar archivo"}
                    </p>
                </div>

                <textarea 
                    placeholder="Descripción opcional..."
                    className="w-full rounded-2xl border-none bg-gray-50 p-4 text-sm font-medium"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                />

                {errorLocal && (
                    <p className="text-rose-500 text-[10px] font-black uppercase text-center">{errorLocal}</p>
                )}

                <div className="flex gap-4">
                    <button type="button" onClick={onSuccess} className="flex-1 p-4 bg-gray-100 rounded-2xl font-black text-[10px] uppercase">Cancelar</button>
                    <button 
                        type="submit" 
                        disabled={uploading}
                        className="flex-1 p-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-indigo-100"
                    >
                        {uploading ? "Subiendo..." : "Confirmar"}
                    </button>
                </div>
            </form>
        </div>
    );
}