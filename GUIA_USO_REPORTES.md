# Guía de Uso - Módulo de Reportes y Auditoría (HU10)

## Acceso al Módulo

1. Inicia sesión como **Administrador**
2. Desde el Dashboard, hace clic en el botón **"Ver reportes"**
3. Serás redirigido a `/reportes` donde se carga el módulo completo

## Pestañas Disponibles

### 1. Logs de Auditoría (RF-036)

Esta pestaña muestra un registro detallado de todas las acciones realizadas en el sistema.

#### Filtros Disponibles:
- **Fecha**: Filtra logs desde una fecha específica
- **Usuario**: Busca por email o nombre de usuario
- **Módulo**: Filtra por sección del sistema (Comunicaciones, Horarios, etc.)
- **Resultado**: Muestra solo acciones exitosas o con errores

#### Columnas de la Tabla:
| Columna | Descripción |
|---------|-------------|
| **Timestamp** | Fecha y hora exacta de la acción |
| **Usuario** | Email o identificación del usuario |
| **Módulo** | Área del sistema donde se realizó la acción |
| **Acción** | Tipo de operación (Creación, Lectura, Actualización, Eliminación) |
| **Resultado** | Estado de la acción (Exitoso/Error) |

#### Acciones:
- ✓ **Aplicar Filtros**: Ejecuta la búsqueda con los filtros especificados
- ✓ **Exportar a CSV**: Descarga los logs visibles en formato CSV

### 2. Reportes de Uso (RF-010 y RF-029)

Contiene tres reportes analíticos basados en datos de los últimos 30 días:

#### a) Reporte de Uso del Sistema
Muestra la actividad de cada usuario:

| Columna | Descripción |
|---------|-------------|
| **Usuario** | Email del usuario |
| **Total de Acciones** | Número de operaciones realizadas |
| **Último Acceso** | Fecha y hora del último acceso |

**Útil para**: Identificar usuarios inactivos o con actividad anormal.

#### b) Reporte de Actividad por Módulo
Muestra cuáles son los módulos más utilizados:

| Columna | Descripción |
|---------|-------------|
| **Módulo** | Nombre del área del sistema |
| **Total de Acciones** | Operaciones registradas |

**Útil para**: Identificar bottlenecks y priorizar mejoras.

#### c) Reporte de Errores del Sistema
Lista todos los errores ocurridos en los últimos 30 días:

| Columna | Descripción |
|---------|-------------|
| **Timestamp** | Cuándo ocurrió el error |
| **Usuario** | Quién estaba haciendo la acción |
| **Módulo** | Dónde ocurrió el error |
| **Acción** | Qué operación causó el error |

**Útil para**: Detectar problemas técnicos y ayudar a los usuarios.

#### Exportar Reportes:
Cada reporte tiene su propio botón "Exportar Reporte" para descargar los datos en CSV.

## Casos de Uso Comunes

### Auditar Cambios Recientes
1. Ve a la pestaña **Logs de Auditoría**
2. Establece la **Fecha** a hoy
3. Selecciona el **Módulo** que quieres revisar
4. Haz clic en **Aplicar Filtros**

### Encontrar Acceso No Autorizado
1. Ve a la pestaña **Logs de Auditoría**
2. Filtra por **Resultado: Error** para ver intentos fallidos
3. Revisa la **IP** y **Usuario** de intentos sospechosos

### Analizar Uso del Sistema
1. Ve a la pestaña **Reportes de Uso**
2. Revisa el **Reporte de Uso del Sistema** para ver usuarios activos
3. Consulta el **Reporte de Actividad por Módulo** para entender patrones de uso

### Diagnosticar Problemas
1. Ve a la pestaña **Reportes de Uso**
2. Revisa el **Reporte de Errores del Sistema**
3. Busca patrones en los errores
4. Contacta al soporte técnico con esta información

## Información Técnica

### Datos Registrados en Auditoría
Para cada acción se registra:
- **Acción**: CREATE, READ, UPDATE, DELETE
- **Usuario**: Quién realizó la acción
- **Timestamp**: Exacto, en zona horaria UTC
- **Módulo**: Sección del sistema
- **IP Address**: Dirección IP del cliente
- **User-Agent**: Navegador y SO utilizado
- **Resultado**: Exitoso o Error
- **Mensaje Error**: Detalles del error (si aplica)

### Retención de Datos
- Los logs se mantienen indefinidamente en la base de datos
- Se recomienda hacer copias de seguridad periódicas
- Para análisis de largo plazo, exporte regularmente a CSV

## Troubleshooting

### "No hay registros disponibles"
- Verifica que haya acciones en el período seleccionado
- Intenta eliminar o cambiar los filtros
- Revisa que tengas permisos de administrador

### El reporte tarda mucho en cargar
- Los reportes analizan hasta 30 días de datos
- Si hay muchas acciones, puede tomar unos segundos
- Intenta usar filtros más específicos

### Los botones de Exportar están deshabilitados
- Solo se habilitan cuando hay datos para exportar
- Verifica que los filtros devuelvan resultados

## Seguridad

⚠️ **Importante**: 
- Solo administradores pueden acceder a este módulo
- Los logs son auditados (acceso registrado)
- No elimines logs de auditoría sin autorización
- Los reportes exportados contienen información sensible

## Contacto y Soporte

Para reportar problemas o sugerencias sobre el módulo de Reportes:
- Abre un issue en el repositorio
- Contacta al equipo de desarrollo
- Incluye screenshots si es necesario
