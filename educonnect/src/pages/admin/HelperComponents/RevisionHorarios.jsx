const RevisionHorarios = ({ horarios }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Curso
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Docente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones (RF-004)
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {horarios.map((horario) => (
                        <tr key={horario.id} className="hover:bg-gray-100">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {horario.curso}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {horario.docente}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                    className="text-green-600 hover:text-green-900 mr-3"
                                >
                                    Aprobar
                                </button>
                                <button
                                    className="text-red-600 hover:text-red-900"
                                >
                                    Rechazar / Comentar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Sección para comentarios de rechazo (oculta hasta que se haga clic en Rechazar) */}
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400">
                <label htmlFor="comentarios-rechazo" className="block text-sm font-medium text-red-700 mb-2">
                    Comentarios de Rechazo (para ajustes)
                </label>
                <textarea
                    id="comentarios-rechazo"
                    rows="3"
                    className="shadow-sm focus:ring-red-500 focus:border-red-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                    placeholder="Ingrese las razones del rechazo o los ajustes requeridos (RF-004)."
                ></textarea>
            </div>
        </div>
    );
};

export default RevisionHorarios;