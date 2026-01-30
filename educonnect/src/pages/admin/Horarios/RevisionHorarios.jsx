import { useState } from "react";
import PopUp from "../../../../components/PopUp"
import { RenderAprobar } from "./RenderAprobar"
import { RenderVer } from "./RenderVer"
import { RenderRechazo } from "./RenderRechazo"
import { RenderDelete } from "./RenderDelete"
const RevisionHorarios = ({ horarios, deleteHorario, }) => {
    const [modal, setModal] = useState(false);
    const [accion, setAccion] = useState("");
    const [horario, setHorario] = useState("");
    const handleOption = (accion, horario) => {
        setAccion(accion)
        setModal(true)
        setHorario(horario)
    };

    const onConfirm = () => {
        console.log("HOla");    
    };

    const onDelete = (horario) => {
        deleteHorario(horario);
        setModal(false)
    };

    return (
        <div className="overflow-x-auto">
            <PopUp isModalOpen={modal} closeModal={() => setModal(false)}>
                <div className="bg-white rounded-xl w-full h-full flex aling-center">
                    {accion === "Aprobar" ? (
                        <RenderAprobar
                            nombre={horario.nombre}
                            onConfirm={onConfirm}
                            onCancel={() => setModal(false)}
                        />
                    ) : accion === "Ver" ? (

                        <RenderVer
                            horario={horario}
                        />

                    ) : accion === "Rechazar" ? (
                        <RenderRechazo
                            onConfirm={onConfirm}
                            onCancel={() => setModal(false)}
                        />
                    ) :
                        (
                            <RenderDelete
                                nombre={horario.nombre}
                                onDelete={onDelete}
                                onCancel={() => setModal(false)}
                            />
                        )
                    }
                </div>
            </PopUp>
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
                            Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {horarios.map((horario) => (
                        <tr key={horario.id} className="hover:bg-gray-100">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {horario.nombre}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {horario.docente}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {horario.estado}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                    className="text-green-600 hover:text-green-900 mr-3"
                                    onClick={() => handleOption("Aprobar", horario)}
                                >
                                    Aprobar
                                </button>
                                <button
                                    className="text-yellow-500 hover:text-yellow-700 mr-3"
                                    onClick={() => handleOption("Ver", horario)}
                                >
                                    Ver
                                </button>
                                {horario.estado != "Publicado" ?
                                    (<button
                                        className="text-red-600 hover:text-red-900"
                                        onClick={() => handleOption("Rechazar", horario)}
                                    >
                                        Rechazar
                                    </button>)
                                    :
                                    (<button
                                        className="text-red-600 hover:text-red-900"
                                        onClick={() => handleOption("Eliminar", horario)}
                                    >
                                        Eliminar
                                    </button>)
                                }
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    );
};

export default RevisionHorarios;