import { useState } from 'react';
import { registrarUsuario } from '../api/authService';

export const useRegister = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const executeRegister = async (userData) => {
        setLoading(true);
        setError(null);
        try {
            const data = await registrarUsuario(userData);
            setLoading(false);
            return { success: true, data };
        } catch (err) {
            setLoading(false);
            setError(err);
            return { success: false, error: err };
        }
    };

    return { executeRegister, loading, error };
};