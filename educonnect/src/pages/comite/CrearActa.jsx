export default function CrearActa() {
    return (
        <div className="p-6 bg-white rounded-lg shadow-md min-h-full">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-2">
                Creación de Acta o Reporte de Comité
            </h2>

            <form className="space-y-6">

                <div>
                    <label htmlFor="tipoDoc" className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Documento
                    </label>
                    <select
                        id="tipoDoc"
                        className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md shadow-sm"
                    >
                        <option value="">Seleccione el tipo...</option>
                        {/*Aca se hara un map de cada circular enviada desde el backend */}
                        <option value="acta">Acta de Reunión</option>
                        <option value="reporte">Reporte de Avance</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
                        Título/Asunto
                    </label>
                    <input
                        type="text"
                        id="titulo"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                </div>

                <div>
                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                        Contenido o Resumen de Decisiones
                    </label>
                    <textarea
                        id="descripcion"
                        rows="5"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                    ></textarea>
                </div>

                <div>
                    <label htmlFor="archivo" className="block text-sm font-medium text-gray-700 mb-1">
                        Adjuntar Acta o Documento
                    </label>
                    <input
                        type="file"
                        id="archivo"
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        className="px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                        Guardar Acta y Registrar Evento
                    </button>
                </div>
            </form>
        </div>
    );
};
