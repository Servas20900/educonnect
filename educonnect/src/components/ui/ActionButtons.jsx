
const BaseButton = ({ onClick, children, className, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-32 py-2 rounded-xl transition-all text-[11px] font-black uppercase shadow-sm ${className}`}
    >
        {children}
    </button>
);

export const BtnVer = ({ onClick }) => (
    <BaseButton onClick={onClick} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white">
        Ver
    </BaseButton>
);

export const BtnDescargar = ({ onClick }) => (
    <BaseButton onClick={onClick} className="bg-blue-50 text-indigo-600 hover:bg-indigo-600 hover:text-white">
        Descargar
    </BaseButton>
);

export const BtnEditar = ({ onClick, disabled }) => (
    <BaseButton 
        onClick={onClick} 
        disabled={disabled}
        className={disabled ? "bg-gray-50 text-gray-300 cursor-not-allowed" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white"}
    >
        Editar
    </BaseButton>
);

export const BtnAprobar = ({ onClick }) => (
    <BaseButton onClick={onClick} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white">
        Aprobar
    </BaseButton>
);

export const BtnRechazar = ({ onClick }) => (
    <BaseButton onClick={onClick} className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white">
        Rechazar
    </BaseButton>
);

export const BtnArchivar = ({ onClick }) => (
    <BaseButton onClick={onClick} className="bg-slate-50 text-slate-600 hover:bg-slate-600 hover:text-white">
        Archivar
    </BaseButton>
);

export const BtnDesactivar = ({ onClick }) => (
    <BaseButton onClick={onClick} className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white">
        Desactivar
    </BaseButton>
);

export const BtnReactivar = ({ onClick }) => (
    <BaseButton onClick={onClick} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white">
        Reactivar
    </BaseButton>
);