# Solución - Error 401 en Session Status

## Problema Original
El error `GET http://localhost:8000/api/auth/session/ 401 (Unauthorized)` ocurría porque:
1. El frontend no estaba enviando el token JWT en los headers
2. El token no se estaba guardando correctamente en localStorage
3. El backend no devolvía el token en la respuesta de login

## Solución Implementada

### 1. Backend - `core/views.py`
**Cambio**: Devolver el token de acceso en la respuesta de login

```python
# Ahora devuelve:
response.data['access'] = access_token      # Token JWT
response.data['refresh'] = refresh_token    # Token de actualización
response.data['user'] = user.username
response.data['role'] = rol
```

**Antes**: El backend eliminaba `access` de la respuesta (`del response.data['access']`)

### 2. Frontend - `authService.js`
**Cambios implementados**:

a) **Interceptor de Request** - Agrega automáticamente el token JWT a cada solicitud:
```javascript
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }
);
```

b) **Interceptor de Response** - Maneja tokens expirados (401):
```javascript
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';  // Redirigir a login
        }
        return Promise.reject(error);
    }
);
```

c) **loginUsuario()** - Guarda correctamente los tokens:
```javascript
if (response.data) {
    if (response.data.access) {
        localStorage.setItem('access_token', response.data.access);
    }
    if (response.data.refresh) {
        localStorage.setItem('refresh_token', response.data.refresh);
    }
}
```

d) **logoutUsuario()** - Nueva función para logout:
```javascript
export const logoutUsuario = async () => {
    await api.post('api/auth/logout/');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    return true;
};
```

### 3. Frontend - `AuthContext.jsx`
**Cambios**:

a) **checkAuth()** mejorado:
```javascript
const checkAuth = useCallback(async () => {
    // Verificar si hay token en localStorage
    const token = localStorage.getItem('access_token');
    if (!token) {
        setAuthState({ role: null, username: null, isLoading: false });
        return;
    }
    // Luego verificar sesión con el servidor
    const response = await getSessionStatus();
    // ...
}, []);
```

b) **logout()** ahora es async:
```javascript
const logout = async () => {
    await logoutUsuario();
    setAuthState({ role: null, username: null, isLoading: false });
};
```

## Flujo Corregido

1. **Login**:
   - Usuario ingresa credenciales
   - Backend autentica y devuelve `access_token` y `refresh_token`
   - Frontend guarda ambos en localStorage
   - Se puede acceder a endpoints protegidos

2. **Cada Solicitud**:
   - Interceptor de request agrega `Authorization: Bearer {token}`
   - Backend verifica el token y procesa la solicitud

3. **Token Expirado**:
   - Backend retorna 401
   - Interceptor de response limpia localStorage y redirige a login

4. **Verificación de Sesión**:
   - AuthContext verifica si hay token en localStorage
   - Si existe, llama a `/api/auth/session/` con el token en headers
   - Si es válido, mantiene sesión abierta

## Archivos Modificados

1. `educonnect-Backend/core/views.py` - Devuelve tokens en respuesta
2. `educonnect/src/api/authService.js` - Interceptores y gestión de tokens
3. `educonnect/src/contexts/AuthContext.jsx` - Mejora en checkAuth y logout

## Resultado

✅ El endpoint `/api/auth/session/` ahora retorna 200 OK
✅ El token se guarda y se envía automáticamente
✅ Sesiones se mantienen correctamente
✅ Logout limpia completamente la sesión
✅ Tokens expirados se manejan automáticamente
