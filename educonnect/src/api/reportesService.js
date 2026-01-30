import { api } from "./authService"

// Obtener todos los logs de auditoría con filtros opcionales
export const fetchAuditoriaLogs = async (filtros = {}) => {
    try {
        const params = new URLSearchParams();
        
        if (filtros.usuario_id) params.append('usuario_id', filtros.usuario_id);
        if (filtros.modulo) params.append('modulo', filtros.modulo);
        if (filtros.accion) params.append('accion', filtros.accion);
        if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
        if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
        if (filtros.resultado) params.append('resultado', filtros.resultado);
        
        const queryString = params.toString() ? `?${params.toString()}` : '';
        const response = await api.get(`api/v1/reportes/auditoria/${queryString}`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

// Obtener reporte de uso del sistema (últimos 30 días)
export const fetchReporteUsoSistema = async () => {
    try {
        const response = await api.get('api/v1/reportes/auditoria/reporte_uso_sistema/');
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

// Obtener reporte por módulo
export const fetchReportePorModulo = async () => {
    try {
        const response = await api.get('api/v1/reportes/auditoria/reporte_por_modulo/');
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

// Obtener reporte de errores
export const fetchReporteErrores = async () => {
    try {
        const response = await api.get('api/v1/reportes/auditoria/reporte_errores/');
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};
