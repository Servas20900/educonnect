import { useCallback, useEffect, useMemo, useState } from 'react'
import { Shield, Lock, Unlock, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import * as PermisosAPI from '../../api/permisosService'
import {
  ConfirmModal,
  DataTable,
  EmptyState,
  FormModal,
  PageHeader,
  ActiveArchiveToggle,
  SearchFilter,
  StatusBadge,
  TabsLayout,
} from '../../components/ui'
import useSystemConfig from '../../hooks/useSystemConfig'

export default function GestionPermisosModulos() {
  const { getCatalog } = useSystemConfig()
  const FILTROS_USUARIOS = [
    {
      key: 'estado',
      label: 'Estado',
      options: getCatalog('filtro_estado_usuario', [
        { value: 'activo', label: 'Activos' },
        { value: 'inactivo', label: 'Inactivos' },
      ]),
    },
  ]

  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [modulos, setModulos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState({})
  const [toast, setToast] = useState(null)

  const [modalEditar, setModalEditar] = useState(false)
  const [modalToggle, setModalToggle] = useState(false)
  const [usuarioSel, setUsuarioSel] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const [rolEditando, setRolEditando] = useState(null)
  const [modalPermisos, setModalPermisos] = useState(false)
  const [submodulosSel, setSubmodulosSel] = useState([])
  const [guardandoRol, setGuardandoRol] = useState(false)

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [usuariosData, rolesData, modulosData] = await Promise.all([
        PermisosAPI.fetchUsuarios(),
        PermisosAPI.fetchRoles(),
        PermisosAPI.fetchModulos(),
      ])
      setUsuarios(usuariosData)
      setRoles(rolesData)
      setModulos(modulosData)
    } catch (err) {
      setError(err?.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const mostrarToast = (texto, tipo = 'success') => {
    setToast({ texto, tipo })
    setTimeout(() => setToast(null), 3500)
  }

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const nombre = (u.persona?.nombre_completo || u.username || '').toLowerCase()
      const email = (u.email || '').toLowerCase()
      const q = busqueda.toLowerCase()
      const isCorreoEstudiante = email.endsWith('@est.mep.go.cr')

      if (isCorreoEstudiante) {
        return false
      }

      const coincideBusqueda = !q || nombre.includes(q) || email.includes(q)

      const estado = filtros.estado
      const coincideEstado =
        !estado ||
        (estado === 'activo' && u.is_active) ||
        (estado === 'inactivo' && !u.is_active)

      return coincideBusqueda && coincideEstado
    })
  }, [usuarios, busqueda, filtros.estado])

  const abrirEditar = (usuario) => {
    const rolesActuales = usuario.roles || (usuario.rol ? [usuario.rol] : [])
    const rolesActualesIds = rolesActuales.map((rol) => Number(rol.id)).filter(Boolean)

    setUsuarioSel({
      ...usuario,
      _rolesAsignados: rolesActualesIds,
      _rolesOriginales: rolesActualesIds,
      _rolNuevo: '',
    })
    setModalEditar(true)
  }

  const abrirToggle = (usuario) => {
    setUsuarioSel(usuario)
    setModalToggle(true)
  }

  const handleGuardarUsuario = async (event) => {
    event.preventDefault()
    if (!usuarioSel?.id) return

    setGuardando(true)
    try {
      await PermisosAPI.updateUsuario(usuarioSel.id, { email: usuarioSel.email })

      const originales = new Set((usuarioSel._rolesOriginales || []).map(Number))
      const asignados = new Set((usuarioSel._rolesAsignados || []).map(Number))
      const rolesAgregar = [...asignados].filter((id) => !originales.has(id))
      const rolesQuitar = [...originales].filter((id) => !asignados.has(id))

      if (rolesAgregar.length > 0) {
        await Promise.all(
          rolesAgregar.map((rolId) => PermisosAPI.assignRoleToUser(usuarioSel.id, rolId))
        )
      }

      if (rolesQuitar.length > 0) {
        await Promise.all(
          rolesQuitar.map((rolId) => PermisosAPI.removeRoleFromUser(usuarioSel.id, rolId))
        )
      }

      mostrarToast('Usuario actualizado correctamente')
      setModalEditar(false)
      setUsuarioSel(null)
      cargarDatos()
    } catch {
      mostrarToast('Error al guardar el usuario', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const agregarRolLocal = () => {
    const nuevoRolId = Number(usuarioSel?._rolNuevo)
    if (!nuevoRolId) return

    setUsuarioSel((prev) => {
      const actuales = prev?._rolesAsignados || []
      if (actuales.includes(nuevoRolId)) {
        return { ...prev, _rolNuevo: '' }
      }
      return {
        ...prev,
        _rolesAsignados: [...actuales, nuevoRolId],
        _rolNuevo: '',
      }
    })
  }

  const quitarRolLocal = (rolId) => {
    setUsuarioSel((prev) => ({
      ...prev,
      _rolesAsignados: (prev?._rolesAsignados || []).filter((id) => id !== rolId),
    }))
  }

  const handleToggle = async () => {
    if (!usuarioSel) return

    setGuardando(true)
    try {
      await PermisosAPI.toggleUsuarioActive(usuarioSel.id)
      mostrarToast(
        `Usuario ${usuarioSel.is_active ? 'desactivado' : 'activado'} correctamente`
      )
      setModalToggle(false)
      setUsuarioSel(null)
      cargarDatos()
    } catch {
      mostrarToast('Error al cambiar el estado', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const abrirEditarPermisos = (rol) => {
    setRolEditando({ ...rol })
    setSubmodulosSel(rol.modulos_permitidos || [])
    setModalPermisos(true)
  }

  const toggleSubmodulo = (id) => {
    setSubmodulosSel((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleGuardarPermisos = async (event) => {
    event.preventDefault()
    if (!rolEditando) return

    setGuardandoRol(true)
    try {
      await PermisosAPI.updateRol(rolEditando.id, {
        nombre: rolEditando.nombre,
        descripcion: rolEditando.descripcion,
        activo: rolEditando.activo,
      })
      await PermisosAPI.updateRolePermissions(rolEditando.id, submodulosSel)

      mostrarToast('Permisos del rol actualizados correctamente')
      setModalPermisos(false)
      setRolEditando(null)
      cargarDatos()
    } catch {
      mostrarToast('Error al guardar los permisos', 'error')
    } finally {
      setGuardandoRol(false)
    }
  }

  const columnasUsuarios = useMemo(
    () => [
      {
        key: 'nombre',
        label: 'Usuario',
        render: (u) => u.persona?.nombre_completo || u.username,
      },
      {
        key: 'email',
        label: 'Correo',
      },
      {
        key: 'roles',
        label: 'Roles',
        render: (u) => {
          const lista = u.roles || (u.rol ? [u.rol] : [])
          if (!lista.length) return <StatusBadge status="Sin rol" size="sm" />

          return (
            <div className="flex flex-wrap gap-1">
              {lista.map((rol) => (
                <StatusBadge key={rol.id ?? rol} status={rol.nombre ?? rol} size="sm" />
              ))}
            </div>
          )
        },
      },
      {
        key: 'is_active',
        label: 'Estado',
        render: (u) => <StatusBadge status={u.is_active ? 'Activo' : 'Inactivo'} size="sm" />,
      },
      {
        key: 'acciones',
        label: 'Acciones',
        render: (u) => (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => abrirEditar(u)}
              className="text-sm font-medium text-[#185fa5] hover:underline"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => abrirToggle(u)}
              className={`text-sm font-medium hover:underline ${
                u.is_active ? 'text-red-600' : 'text-[#0f6e56]'
              }`}
            >
              {u.is_active ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        ),
      },
    ],
    []
  )

  const usuariosTab = (
    <div className="space-y-4">
      <ActiveArchiveToggle
        viewMode={filtros.estado === 'inactivo' ? 'archivados' : 'activos'}
        onChange={(mode) => {
          setFiltros((prev) => ({
            ...prev,
            estado: mode === 'archivados' ? 'inactivo' : 'activo',
          }))
        }}
        activeLabel="Activos"
        archivedLabel="Inactivos"
        activeCount={usuarios.filter((u) => {
          const email = (u.email || '').toLowerCase()
          return !email.endsWith('@est.mep.go.cr') && u.is_active
        }).length}
        archivedCount={usuarios.filter((u) => {
          const email = (u.email || '').toLowerCase()
          return !email.endsWith('@est.mep.go.cr') && !u.is_active
        }).length}
      />

      <SearchFilter
        value={busqueda}
        onChange={setBusqueda}
        placeholder="Buscar por nombre o correo..."
        filters={FILTROS_USUARIOS}
        onFilterChange={({ key, value }) => {
          setFiltros((prev) => ({ ...prev, [key]: value }))
        }}
      />

      <DataTable
        columns={columnasUsuarios}
        data={usuariosFiltrados}
        loading={loading}
        emptyMessage={
          busqueda || filtros.estado
            ? 'No se encontraron usuarios con ese criterio'
            : 'No hay usuarios registrados'
        }
      />
    </div>
  )

  const permisosTab = (
    <div className="space-y-4">
      {loading ? (
        <DataTable columns={[{ key: 'skeleton', label: 'Cargando' }]} data={[]} loading />
      ) : roles.length === 0 ? (
        <EmptyState message="No hay roles configurados en el sistema" />
      ) : (
        roles.map((rol) => (
          <div
            key={rol.id}
            className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#0b2545]">{rol.nombre}</span>
                <StatusBadge status={rol.activo ? 'Activo' : 'Inactivo'} size="sm" />
              </div>

              <p className="text-xs text-slate-500">{rol.descripcion || 'Sin descripción'}</p>

              <div className="flex flex-wrap gap-1 pt-1">
                {(rol.modulos_permitidos || []).length > 0 ? (
                  rol.modulos_permitidos.map((moduloId) => {
                    const mod = modulos.find((m) => m.id === moduloId)
                    return (
                      <span
                        key={moduloId}
                        className="rounded-full bg-[#e6f1fb] px-2 py-0.5 text-xs font-medium text-[#185fa5]"
                      >
                        {mod?.nombre || moduloId}
                      </span>
                    )
                  })
                ) : (
                  <span className="text-xs italic text-slate-400">Sin módulos asignados</span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => abrirEditarPermisos(rol)}
              className="shrink-0 rounded-lg bg-[#185fa5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0c447c]"
            >
              Configurar
            </button>
          </div>
        ))
      )}
    </div>
  )

  const tabs = [
    { label: 'Usuarios', content: usuariosTab },
    { label: 'Permisos por rol', content: permisosTab },
  ]

  return (
    <div className="space-y-6 p-6">
      {toast ? (
        <div
          className={`fixed right-4 top-4 z-50 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg transition-all ${
            toast.tipo === 'success' ? 'bg-[#0f6e56]' : 'bg-red-600'
          }`}
        >
          {toast.texto}
        </div>
      ) : null}

      <PageHeader
        title="Usuarios y permisos"
        subtitle="Gestión de cuentas, roles y acceso a módulos del sistema"
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div>{error}</div>
          <button
            type="button"
            onClick={cargarDatos}
            className="mt-2 font-medium text-red-700 underline"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      <TabsLayout tabs={tabs} defaultTab={0} />

      <FormModal
        open={modalEditar}
        title={`Editar usuario - ${usuarioSel?.persona?.nombre_completo || usuarioSel?.username || ''}`}
        onClose={() => {
          setModalEditar(false)
          setUsuarioSel(null)
        }}
        onSubmit={handleGuardarUsuario}
        loading={guardando}
        submitLabel="Guardar cambios"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Correo electrónico</label>
            <input
              type="email"
              value={usuarioSel?.email || ''}
              onChange={(e) => {
                const email = e.target.value
                setUsuarioSel((prev) => ({ ...prev, email }))
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#378add]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Roles asignados</label>

            <div className="mb-3 flex flex-wrap gap-2">
              {(usuarioSel?._rolesAsignados || []).length > 0 ? (
                (usuarioSel?._rolesAsignados || []).map((rolId) => {
                  const rol = roles.find((item) => Number(item.id) === Number(rolId))
                  return (
                    <span
                      key={rolId}
                      className="inline-flex items-center gap-2 rounded-full bg-[#e6f1fb] px-3 py-1 text-xs font-medium text-[#185fa5]"
                    >
                      {rol?.nombre || `Rol ${rolId}`}
                      <button
                        type="button"
                        onClick={() => quitarRolLocal(Number(rolId))}
                        className="text-[#0b2545] hover:text-red-600"
                      >
                        Quitar
                      </button>
                    </span>
                  )
                })
              ) : (
                <span className="text-xs italic text-slate-400">Sin roles asignados</span>
              )}
            </div>

            <div className="flex gap-2">
              <select
                value={usuarioSel?._rolNuevo || ''}
                onChange={(e) => {
                  const rolId = e.target.value ? Number(e.target.value) : ''
                  setUsuarioSel((prev) => ({ ...prev, _rolNuevo: rolId }))
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#378add]"
              >
                <option value="">Seleccionar rol para agregar</option>
                {roles
                  .filter((rol) => rol.activo)
                  .map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {rol.nombre}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={agregarRolLocal}
                className="rounded-lg bg-[#185fa5] px-3 py-2 text-sm font-medium text-white hover:bg-[#0c447c]"
              >
                Agregar
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">Podés asignar varios roles y quitar solo los necesarios.</p>
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        open={modalToggle}
        variant={usuarioSel?.is_active ? 'danger' : 'info'}
        title={usuarioSel?.is_active ? 'Desactivar usuario' : 'Activar usuario'}
        message={`¿Confirmás que querés ${
          usuarioSel?.is_active ? 'desactivar' : 'activar'
        } a ${usuarioSel?.persona?.nombre_completo || usuarioSel?.username || ''}?`}
        confirmLabel={usuarioSel?.is_active ? 'Sí, desactivar' : 'Sí, activar'}
        onConfirm={handleToggle}
        onCancel={() => {
          setModalToggle(false)
          setUsuarioSel(null)
        }}
        loading={guardando}
      />

      <FormModal
        open={modalPermisos}
        title={`Permisos - ${rolEditando?.nombre || ''}`}
        onClose={() => {
          setModalPermisos(false)
          setRolEditando(null)
        }}
        onSubmit={handleGuardarPermisos}
        loading={guardandoRol}
        submitLabel="Guardar configuración"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Seleccioná los módulos a los que este rol puede acceder.
          </p>

          {modulos.map((modulo) => (
            <label
              key={modulo.id}
              className="cursor-pointer rounded-lg border border-slate-200 p-3 transition-colors hover:border-[#378add]"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={submodulosSel.includes(modulo.id)}
                  onChange={() => toggleSubmodulo(modulo.id)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#185fa5] focus:ring-[#378add]"
                />
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[#0b2545]">{modulo.nombre}</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(modulo.submodulos || []).slice(0, 4).map((submodulo, index) => (
                      <span
                        key={`${modulo.id}-${submodulo}-${index}`}
                        className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                      >
                        {submodulo}
                      </span>
                    ))}
                    {modulo.submodulos?.length > 4 ? (
                      <span className="text-xs italic text-slate-400">
                        +{modulo.submodulos.length - 4} más
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </label>
          ))}

          {modulos.length === 0 ? <EmptyState message="No hay módulos definidos en el sistema" /> : null}
        </div>
      </FormModal>
    </div>
  )
}
