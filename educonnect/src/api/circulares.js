import {api} from "./authService"

export const fetchCirculares = async () => {
    try {
        const response = await api.get('api/v1/ComunicacionesCircular/');
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};
export const createCirculares = async (data) => {
    try {
        const response = await api.post('api/v1/ComunicacionesCircular/',data);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};
export const updateCirculares = async (data,id) => {
    try {
        const response = await api.put('api/v1/ComunicacionesCircular/'+id+"/",data);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};
export const deleteCirculares = async (id) => {
    try {
        const response = await api.delete('api/v1/ComunicacionesCircular/'+id+"/");
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};