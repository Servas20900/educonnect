# EduConnect

Guia basica para levantar el sistema en desarrollo.

## Requisitos

- Docker Desktop
- Node.js 18+
- npm

## Estructura

- `educonnect-Backend/`: API Django
- `educonnect/`: Frontend React + Vite
- `docker-compose.yml`: servicios de backend y base de datos

## 1) Levantar backend y base de datos

Desde la carpeta `educonnect/`:

```powershell
docker compose up --build
```

Esto levanta:
- PostgreSQL en `localhost:5432`
- Backend en `http://localhost:8000`

## 2) Correr seed de demo

Con los contenedores arriba, desde `educonnect/`:

```powershell
docker compose exec backend python manage.py seed_demo
```

Opcional con cantidades personalizadas:

```powershell
docker compose exec backend python manage.py seed_demo --docentes 15 --estudiantes 120 --encargados 50 --comite-users 8 --auxiliares-users 5 --year 2026
```

## 3) Levantar frontend

En otra terminal, desde `educonnect/educonnect/`:

```powershell
npm install
npm run dev
```

Frontend disponible en:
- `http://localhost:5173`

## 4) Credenciales de acceso (demo)

Despues de correr `seed_demo`:

- Usuario admin: `admin`
- Password admin: `educonnect123`

El seed tambien crea usuarios docentes y estudiantes con dominios institucionales:
- `@mep.go.cr`
- `@est.mep.go.cr`

## 5) Comandos utiles

Backend checks:

```powershell
docker compose exec backend python manage.py check
```

Backend tests (si existen):

```powershell
docker compose exec backend python manage.py test
```

Frontend lint:

```powershell
npm run lint
```

Frontend build:

```powershell
npm run build
```