const BASE =
  'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium text-white ' +
  'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

export const BtnPrimario = ({ onClick, children, disabled, type = 'button' }) => (
  <button type={type} onClick={onClick} disabled={disabled}
    className={`${BASE} bg-[#185fa5] hover:bg-[#0c447c] focus:ring-[#185fa5]`}>
    {children}
  </button>
)

export const BtnSecundario = ({ onClick, children, disabled, type = 'button' }) => (
  <button type={type} onClick={onClick} disabled={disabled}
    className={`${BASE} bg-[#0b2545] hover:bg-[#081a31] focus:ring-[#0b2545]`}>
    {children}
  </button>
)

// ── Acciones positivas ──────────────────────────────────────────────────────

export const BtnAprobar = ({ onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    className={`${BASE} bg-[#0f6e56] hover:bg-[#085041] focus:ring-[#0f6e56]`}>
    Aprobar
  </button>
)

export const BtnActivar = ({ onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    className={`${BASE} bg-[#0f6e56] hover:bg-[#085041] focus:ring-[#0f6e56]`}>
    Activar
  </button>
)

export const BtnReactivar = ({ onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    className={`${BASE} bg-[#0f6e56] hover:bg-[#085041] focus:ring-[#0f6e56]`}>
    Reactivar
  </button>
)

export const BtnRestaurar = ({ onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    className={`${BASE} bg-[#0f6e56] hover:bg-[#085041] focus:ring-[#0f6e56]`}>
    Restaurar
  </button>
)

// ── Acciones neutras ────────────────────────────────────────────────────────

export const BtnVer = ({ onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    className={`${BASE} bg-[#185fa5] hover:bg-[#0c447c] focus:ring-[#185fa5]`}>
    Ver
  </button>
)

export const BtnEditar = ({ onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    className={`${BASE} bg-[#185fa5] hover:bg-[#0c447c] focus:ring-[#185fa5]`}>
    Editar
  </button>
)

export const BtnDescargar = ({ onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    className={`${BASE} bg-[#0b2545] hover:bg-[#185fa5] focus:ring-[#185fa5]`}>
    Descargar
  </button>
)

export const BtnEnviar = ({ onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    className={`${BASE} bg-[#185fa5] hover:bg-[#0c447c] focus:ring-[#185fa5]`}>
    Enviar
  </button>
)

export const BtnCancelar = ({ onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    className={`${BASE} bg-slate-500 hover:bg-slate-600 focus:ring-slate-400`}>
    Cancelar
  </button>
)

// ── Acciones destructivas / archivo ────────────────────────────────────────

export const BtnArchivar = ({ onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    className={`${BASE} bg-[#0b2545] hover:bg-[#081a31] focus:ring-[#0b2545]`}>
    Archivar
  </button>
)

export const BtnDesactivar = ({ onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    className={`${BASE} bg-[#0b2545] hover:bg-[#185fa5] focus:ring-[#185fa5]`}>
    Desactivar
  </button>
)

export const BtnRechazar = ({ onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    className={`${BASE} bg-rose-600 hover:bg-rose-700 focus:ring-rose-500`}>
    Rechazar
  </button>
)
