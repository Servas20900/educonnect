import { Database, Download, Upload, AlertCircle, Clock, Shield } from 'lucide-react';

export default function Backups() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Backups y Retención de Datos</h1>
            <p className="text-sm text-gray-600">Gestión de copias de seguridad y políticas de retención</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-yellow-200 p-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Módulo en construcción</h3>
            <p className="text-gray-600 text-sm">
              Esta funcionalidad está siendo desarrollada. Se implementarán opciones para crear backups,
              restaurar datos y configurar políticas de retención automática.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}