import {api} from "./authService"

export const fetchHorario = async () => {
    try {
        const response = await api.get('/api/v1/horario/Horarios/');
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};
export const createHorario = async (data) => {
    try {
        const response = await api.post('/api/v1/horario/Horarios/',data);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};
export const updateHorario = async (data,id) => {
    try {
        const response = await api.put('/api/v1/horario/Horarios/'+id+"/",data);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};
export const deleteHorario = async (id) => {
    try {
        const response = await api.delete('/api/v1/horario/Horarios/'+id+"/");
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};