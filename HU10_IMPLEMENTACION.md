# HU10 - Reportes de Uso y Auditoría - Implementación Completa

## Resumen
Se ha implementado completamente la Historia de Usuario HU10 que permite a los administradores ver reportes de uso y auditoría para asegurar transparencia y control en el sistema.

## Cambios en el Backend

### 1. **Serializers** (apps/databaseModels/serializers.py)
- **ReadSerializerAuthAuditoriaLog**: Serializer para los logs de auditoría que incluye:
  - Información del usuario (email y nombre completo)
  - Detalles de la acción (acción, módulo, descripción)
  - Resultado (exitoso/error)
  - Timestamp y dirección IP

### 2. **Views** (apps/databaseModels/views.py)
- **ViewAuthAuditoriaLog**: ViewSet ReadOnly que proporciona:
  - Listado de logs con filtros avanzados:
    - Por usuario
    - Por módulo
    - Por acción
    - Por resultado
    - Por rango de fechas
  - **Endpoints personalizados:**
    - `/auditoria/reporte_uso_sistema/` - Actividad por usuario en últimos 30 días
    - `/auditoria/reporte_por_modulo/` - Actividad agrupada por módulo
    - `/auditoria/reporte_errores/` - Últimos errores registrados

### 3. **URLs** (apps/databaseModels/urls.py)
- Registrado el router para el ViewSet de auditoría en `api/v1/auditoria/`

### 4. **Signals** (apps/databaseModels/signals.py)
- Captura automática de eventos:
  - **Creación/Modificación de Circulares**
  - **Cambios en Horarios**
  - **Cambios en Roles**
  - **Eliminación de Registros**

### 5. **Middleware** (apps/databaseModels/middleware.py)
- **AuditoriaMiddleware**: Registra automáticamente:
  - Todas las peticiones a endpoints `/api/`
  - Intentos de acceso fallidos (401)
  - Información del cliente (IP, User-Agent)
  - Resultado de cada operación (exitoso/error)

### 6. **Settings** (core/settings.py)
- Agregado el middleware de auditoría a la lista de MIDDLEWARE

## Cambios en el Frontend

### 1. **Servicio API** (src/api/reportesService.js)
Nuevo archivo con funciones para consumir los endpoints:
- `fetchAuditoriaLogs(filtros)` - Obtener logs con filtros opcionales
- `fetchReporteUsoSistema()` - Reporte de actividad por usuario
- `fetchReportePorModulo()` - Reporte de actividad por módulo
- `fetchReporteErrores()` - Reporte de errores del sistema

### 2. **Componente Principal** (src/pages/admin/Reportes.jsx)
Completamente refactorizado con:

#### Estado y Hooks
- useState para logs, reportes y filtros
- useEffect para cargar datos al montar el componente
- Manejo de loading y errores

#### Funcionalidades
1. **Filtros dinámicos:**
   - Por fecha
   - Por usuario
   - Por módulo
   - Por resultado (Exitoso/Error)

2. **Dos tabs principales:**
   - **Logs de Auditoría**: Visualización detallada de acciones
   - **Reportes de Uso**: 
     - Actividad por usuario
     - Actividad por módulo
     - Errores del sistema

3. **Exportación a CSV:** Botones para descargar reportes en formato CSV

4. **Interfaz mejorada:**
   - Tabla responsive con scroll horizontal
   - Indicadores de estado (Exitoso en verde, Error en rojo)
   - Mensajes de carga y error
   - Información clara y organizada

## Endpoints Disponibles

### GET `/api/v1/auditoria/`
Lista todos los logs de auditoría con soporte para filtros:
```
?usuario_id=1&modulo=Comunicaciones&fecha_inicio=2025-01-01T00:00:00&resultado=Exitoso
```

### GET `/api/v1/auditoria/reporte_uso_sistema/`
Retorna actividad agrupada por usuario (últimos 30 días):
```json
[
  {
    "usuario__email": "admin@example.com",
    "total_acciones": 45,
    "ultimo_acceso": "2025-01-29T10:30:00Z"
  }
]
```

### GET `/api/v1/auditoria/reporte_por_modulo/`
Retorna actividad agrupada por módulo:
```json
[
  {
    "modulo": "Comunicaciones",
    "total_acciones": 120
  }
]
```

### GET `/api/v1/auditoria/reporte_errores/`
Retorna los últimos 100 errores registrados:
```json
[
  {
    "id": 1,
    "usuario_email": "usuario@example.com",
    "accion": "POST /api/v1/circular/",
    "modulo": "Comunicaciones",
    "resultado": "Error",
    "fecha_hora": "2025-01-29T10:30:00Z"
  }
]
```

## Flujo de Auditoría

1. **Registro automático**: Cada acción en el API es capturada por el middleware
2. **Almacenamiento**: Se guarda en la tabla `auth_auditoria_log`
3. **Visualización**: Disponible en el módulo de Reportes
4. **Filtrado**: Los administradores pueden filtrar por múltiples criterios
5. **Exportación**: Los reportes se pueden descargar en CSV

## RF Cumplidos

- **RF-010**: Reporte de Uso del Sistema ✓
- **RF-029**: Reporte de Cumplimiento (base implementada) ✓
- **RF-036**: Logs de Auditoría y Trazabilidad ✓

## Próximos Pasos Opcionales

1. Agregar gráficos de visualización de datos
2. Implementar alertas automáticas para actividades sospechosas
3. Agregar autenticación de dos factores para ciertas operaciones
4. Crear reportes programados que se envíen automáticamente
5. Implementar archivado de logs antiguos

## Testing

Para probar la funcionalidad:
1. Realizar acciones en el sistema (crear circulares, cambiar horarios, etc.)
2. Navegar a la sección "Reportes" en el panel de administración
3. Verificar que los logs aparezcan en la tabla de auditoría
4. Probar los filtros
5. Descargar reportes en CSV
