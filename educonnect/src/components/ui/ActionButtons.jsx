const BaseButton = ({ onClick, children, className, disabled }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${className}`}
    >
        {children}
    </button>
);

// --- BOTONES CON ESTILO SÓLIDO (OSCUROS/COLORES FUERTES) ---

export const BtnArchivar = ({ onClick }) => (
    <BaseButton onClick={onClick} className="bg-[#0b2545] hover:bg-[#081a31] focus:ring-[#0b2545]">
        Archivar
    </BaseButton>
);

export const BtnDesactivar = ({ onClick }) => (
    <BaseButton onClick={onClick} className="bg-[#0b2545] hover:bg-[#185fa5] focus:ring-[#185fa5]">
        Desactivar
    </BaseButton>
);

export const BtnRechazar = ({ onClick }) => (
    <BaseButton onClick={onClick} className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-500">
        Rechazar
    </BaseButton>
);

// --- BOTONES CON ESTILO SÓLIDO (VERDES/AZULES) ---

export const BtnAprobar = ({ onClick }) => (
    <BaseButton onClick={onClick} className="bg-[#0f6e56] hover:bg-[#085041] focus:ring-[#0f6e56]">
        Aprobar
    </BaseButton>
);

export const BtnActivar = ({ onClick }) => (
    <BaseButton onClick={onClick} className="bg-[#0f6e56] hover:bg-[#085041] focus:ring-[#0f6e56]">
        Activar
    </BaseButton>
);

export const BtnVer = ({ onClick }) => (
    <BaseButton onClick={onClick} className="bg-[#185fa5] hover:bg-[#0c447c] focus:ring-[#185fa5]">
        Ver
    </BaseButton>
);

export const BtnDescargar = ({ onClick }) => (
    <BaseButton onClick={onClick} className="bg-[#0b2545] hover:bg-[#185fa5] focus:ring-[#185fa5]">
        Descargar
    </BaseButton>
);

// --- BOTÓN EDITAR CON LÓGICA DE DESHABILITADO ---

export const BtnEditar = ({ onClick, disabled }) => (
    <BaseButton 
        onClick={onClick} 
        disabled={disabled}
        className={disabled 
            ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
            : "bg-[#185fa5] hover:bg-[#0c447c] focus:ring-[#185fa5]"
        }
    >
        Editar
    </BaseButton>
);