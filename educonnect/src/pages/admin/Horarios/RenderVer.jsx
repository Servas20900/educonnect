export const RenderVer = ({ horario }) => {
    
    const primerDetalle = horario.detalles?.[0];
    const segundoDetalle = horario.aprobaciones?.[0];


    return (
        <div className="space-y-6 p-4">
            <div className="border-b border-gray-100 pb-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-gray-800 tracking-tight">{horario.nombre}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${horario.estado === 'Aprobado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                        {horario.estado}
                    </span>
                </div>
                <p className="text-gray-500 text-sm mt-1 italic">"{horario.notas || 'Sin notas adicionales'}"</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Docente Responsable</p>
                    <p className="text-sm font-semibold text-gray-700">{horario.docente_info.nombre}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Modalidad</p>
                    <p className="text-sm font-semibold text-gray-700">{horario.tipo_horario}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Grupo</p>
                    <p className="text-sm font-semibold text-gray-700">{horario.grupo}</p>
                </div>
            </div>

            {primerDetalle && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4">
                    <h4 className="text-xs font-bold text-indigo-600 uppercase mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                        Información del Bloque
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <p className="text-gray-600">Día: <span className="text-gray-900 font-medium">{primerDetalle.dia_semana}</span></p>
                        <p className="text-gray-600">Aula: <span className="text-gray-900 font-medium">{primerDetalle.aula}</span></p>
                        <p className="text-gray-600">Horario: <span className="text-gray-900 font-medium">{primerDetalle.hora_inicio.slice(0, 5)} - {primerDetalle.hora_fin.slice(0, 5)}</span></p>
                        <p className="text-gray-600">Materia ID: <span className="text-gray-900 font-medium">{primerDetalle.asignatura}</span></p>
                    </div>
                </div>
            )}

            <div className="pt-4 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Registro de Aprobaciones</p>
                {segundoDetalle ? (
                    <div className="mt-6 pt-6 border-t border-dashed border-gray-200">
                        <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4 text-sm">
                            <div className="text-gray-500">Versión: <span className="text-gray-800 font-semibold">{horario.version}</span></div>
                            <div className="text-gray-500">Estado: <span className="text-green-600 font-semibold">{horario.estado}</span></div>
                            <div className="text-gray-400 text-xs italic col-span-2 mt-2">
                                Última modificación: {new Date(horario.fecha_modificacion).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 italic">No hay registros de aprobación para la versión {horario.version}.</p>
                )}
            </div>
        </div>
    );
};