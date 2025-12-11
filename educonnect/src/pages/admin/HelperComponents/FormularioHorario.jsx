const FormularioHorario = () => {
    return (
        <div className="space-y-6">
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-gray-200 rounded-md bg-gray-50">

                <div className="flex flex-col">
                    <label htmlFor="nombreCurso" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Curso
                    </label>
                    <input
                        type="text"
                        id="nombreCurso"
                        name="nombreCurso"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>

                <div className="flex flex-col">
                    <label htmlFor="docenteId" className="block text-sm font-medium text-gray-700 mb-1">
                        Docente Asignado
                    </label>
                    <select
                        id="docenteId"
                        name="docenteId"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                    >
                        <option value="">Seleccione un docente...</option>
                        <option value="doc1">Docente A</option>
                        <option value="doc2">Docente B</option>
                    </select>
                </div>

                <div className="flex flex-col">
                    <label htmlFor="dia" className="block text-sm font-medium text-gray-700 mb-1">
                        Día de la Semana
                    </label>
                    <select
                        id="dia"
                        name="dia"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                    >
                        <option value="">Seleccione el día...</option>
                        <option value="L">Lunes</option>
                        <option value="M">Martes</option>
                        {/* ... otras opciones ... */}
                    </select>
                </div>

                <div className="flex flex-col">
                    <label htmlFor="horaInicio" className="block text-sm font-medium text-gray-700 mb-1">
                        Hora de Inicio
                    </label>
                    <input
                        type="time"
                        id="horaInicio"
                        name="horaInicio"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>

                <div className="flex flex-col">
                    <label htmlFor="horaFin" className="block text-sm font-medium text-gray-700 mb-1">
                        Hora de Fin
                    </label>
                    <input
                        type="time"
                        id="horaFin"
                        name="horaFin"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>

            </form>

            <div className="flex justify-end space-x-3 mt-6">
                <button
                    type="button"
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                    Guardar Horario (Crear/Editar)
                </button>
                <button
                    type="button"
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    Eliminar Horario
                </button>
            </div>
        </div>
    );
};

export default FormularioHorario;