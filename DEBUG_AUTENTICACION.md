# Troubleshooting - Errores de Autenticación Corregidos

## Problemas Detectados

### 1. Error 500 en `/api/auth/login/`
**Causa**: En `ObtencionTokens.post()`, se intentaba acceder a `request.user` en una solicitud POST de login sin autenticación previa.

**Línea problemática**:
```python
user = request.user  # request.user es AnonymousUser en login
rol = obtener_rol_usuario(user)  # Esto causaba error
```

**Solución**: Decodificar el token JWT después de obtenerlo para extraer el `user_id` y luego consultar la base de datos:
```python
token = AccessToken(access_token)
user_id = token.get('user_id')
user = AuthUsuario.objects.get(id=user_id)
```

### 2. Error 401 en `/api/auth/session/`
**Causa**: El middleware de auditoría estaba intentando registrar acciones de usuarios no autenticados, lo que causaba problemas.

**Solución**: Modificar el middleware para:
- Excluir rutas de autenticación (`/api/auth/login/`, `/api/auth/logout/`, `/api/auth/refresh/`)
- Solo registrar acciones de usuarios autenticados
- Mejorar el manejo de excepciones

## Cambios Realizados

### Backend - `core/views.py`
- **Antes**: Accedía a `request.user` directamente (no disponible en login)
- **Después**: Decodifica el token JWT para obtener `user_id`

### Backend - `middleware.py`
- **Lista de exclusión**: Rutas de autenticación ya no se auditan
- **Validación de usuario**: Solo registra si `request.user.is_authenticated`
- **Logging mejorado**: Ahora registra errores en logs sin interrumpir la aplicación

### Backend - `settings.py`
- Middleware de auditoría está habilitado y optimizado

## Cómo Verificar que Funciona

1. **Probar login**:
   ```bash
   curl -X POST http://localhost:8000/api/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"password"}'
   ```
   Debe retornar: `200 OK` con token y rol

2. **Probar sesión**:
   ```bash
   curl -X GET http://localhost:8000/api/auth/session/ \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   Debe retornar: `200 OK` con estado de autenticación

3. **Revisar logs en base de datos**:
   Solo se registran acciones de usuarios autenticados a partir de ahora.

## Archivos Modificados
- `educonnect-Backend/core/views.py`
- `educonnect-Backend/apps/databaseModels/middleware.py`
- `educonnect-Backend/core/settings.py`

## Estado Actual
✅ Errores de autenticación corregidos
✅ Middleware mejorado
✅ Auditoría funciona para usuarios autenticados
✅ No hay conflictos entre HU10 y autenticación
