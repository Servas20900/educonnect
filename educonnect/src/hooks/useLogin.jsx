import { useState } from 'react';
import { loginUsuario } from '../api/authService';

export const useLogin = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const executeLogin = async (credentials) => {
        setLoading(true);
        setError(null);
        try {
            const data = await loginUsuario(credentials);
            setLoading(false);
            return { success: true, data };
        } catch (err) {
            setLoading(false);
            setError(err);
            return { success: false, error: err };
        }
    };

    return { executeLogin, loading, error };
};