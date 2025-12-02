# EduConnect

EduConnect es un sistema web de administración escolar diseñado para gestionar usuarios, roles, estudiantes, docentes y procesos internos de una institución educativa. Su objetivo es ofrecer una plataforma moderna, segura y escalable que permita a la escuela centralizar su información y operaciones.

## Características principales

- Gestión de usuarios y roles (administradores, docentes, estudiantes).
- Panel administrativo para manejo de datos escolares.
- Interfaz moderna y accesible basada en componentes reutilizables.
- Arquitectura preparada para integrarse con un API/backend.

## Tecnologías principales

- **Front-end:** React + Vite
- **UI:** Material UI (MUI)
- **Routing:** React Router
- **Gestor de paquetes:** PNPM
- **Integración backend:** Pendiente (API por implementar / conectar según tu desarrollo)

## Requisitos

- Node.js (recomendado: LTS actual)
- PNPM instalado globalmente (opcional, puedes usar npm/yarn si lo prefieres)

## Instalación

Clona el repositorio y instala dependencias:

```bash
git clone <tu-repo-o-url>    # o usar la url remota del proyecto
cd educonnect
pnpm install
```

## Desarrollo

Arranca el servidor de desarrollo (Vite):

```bash
pnpm dev
```

Abre `http://localhost:5173` (o la URL que indique Vite) en tu navegador.

## Build para producción

```bash
pnpm build
```

Los artefactos se generarán en la carpeta `dist/`.

## Estructura del proyecto (resumen)

- `src/` – Código fuente de la aplicación
  - `components/` – Componentes reutilizables de UI
  - `pages/` – Vistas principales (admin, docente, estudiante)
  - `layout/` – Componentes de layout y navegación
  - `api/` – llamadas a servicios/endpoint (adaptar según backend)
- `public/` – Archivos estáticos


## Buenas prácticas y recomendaciones

- Mantener componentes pequeños y reutilizables.
- Centralizar configuración en `src/config` y usar context para settings globales.
- Añadir pruebas unitarias para lógica crítica y componentes clave.

