import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="p-6 bg-white rounded-lg shadow-md min-h-full space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                    Panel de Comité
                </h2>
                <p className="text-sm text-gray-500">
                    Accesos rápidos para roles internos y documentos del comité.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                    to="/comite/roles"
                    className="rounded-lg border border-gray-200 bg-gray-50 p-5 shadow-sm hover:border-indigo-300 hover:bg-white"
                >
                    <h3 className="text-lg font-semibold text-gray-900">Roles internos</h3>
                    <p className="text-sm text-gray-600 mt-2">
                        Asigna y actualiza responsabilidades del comité.
                    </p>
                </Link>

                <Link
                    to="/comite/documentos"
                    className="rounded-lg border border-gray-200 bg-gray-50 p-5 shadow-sm hover:border-indigo-300 hover:bg-white"
                >
                    <h3 className="text-lg font-semibold text-gray-900">Documentos</h3>
                    <p className="text-sm text-gray-600 mt-2">
                        Consulta y descarga actas y reportes del comité.
                    </p>
                </Link>
            </div>

            <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                    Los roles y documentos solo están disponibles para miembros del comité correspondiente.
                </p>
            </div>
        </div>
    );
}