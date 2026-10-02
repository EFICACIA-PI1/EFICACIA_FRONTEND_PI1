# EFICACIA_FRONTEND_PI1

Frontend del mini proyecto **EFICACIA · Organizador de eventos independientes**. Aplicación de una sola página (SPA) construida con React + Vite que permite crear eventos, gestionar el plan logístico (gestiones), marcar tareas como hechas, diferirlas y visualizar el progreso de cada evento.

## Funcionalidades

- **Autenticación**: inicio de sesión (`/login`), registro (`/registro`), recuperación de contraseña (`/recuperar` y `/reset-password?uid=&token=`, el enlace que envía el correo del backend) y cierre de sesión (invalida el token en el servidor). El token se guarda en `localStorage` y se envía como `Authorization: Token <token>`. Si la API responde 401 se cierra la sesión. Las demás rutas están protegidas.
- **Mi perfil** (`/perfil`): datos desde `GET /auth/me/`, edición (`PATCH`: nombre completo, correo, teléfono y dirección; usuario y documento son de solo lectura) y cambio de contraseña.
- **Hoy** (`/hoy`): gestiones vencidas, para hoy y próximas (`GET /hoy/`), con filtros por **evento** y **estado** guardados en la URL (`?event=1&state=pospuesta`). Alertas de sobrecarga de horas, posponer y marcar como hecha.
- **Eventos** (`/eventos`): listado con barra de progreso y eliminación.
- **Crear** (`/crear`): formulario de nuevo evento.
- **Detalle** (`/evento/:id`): crear, editar, reprogramar, posponer y eliminar gestiones con validación del límite diario de horas.
- **Progreso** (`/progreso`): avance general y por evento.
- Notificaciones (toasts), página 404, `ErrorBoundary` global, carga diferida de rutas y título de pestaña por ruta.

> **Backend:** los endpoints de autenticación y perfil están en la rama `develop` del backend. `state` es de solo lectura en el serializer de tareas, por lo que marcar una gestión como hecha todavía no persiste.

## Estructura

```
src/
  components/   UI reutilizable (Button, Field, Modal, Icon, StateViews, Layout…)
  context/      AuthContext (sesión) y ToastContext (notificaciones)
  hooks/        usePageTitle, useScrollLock
  pages/        una por ruta (carga diferida)
  services/     api.js (fetch + token), authService, eventsApi, tasksApi, todayApi, mappers
  utils/        dates, tasks, format, forms
```

## Stack

- React 19
- Vite 8
- React Router 7
- Tailwind CSS 3

## Requisitos previos

- Node.js **20.19+** (o la versión que soporte Vite 8)
- npm

## Variables de entorno

Copia `.env.example` a `.env` y ajusta los valores si es necesario:

```bash
cp .env.example .env
```

| Variable         | Descripción                                                    | Valor por defecto          |
| ---------------- | -------------------------------------------------------------- | -------------------------- |
| `VITE_API_URL`   | URL base de la API del backend, sin barra final (solo las que empiezan con `VITE_` son expuestas al cliente). | `http://localhost:8000/api` |

## Cómo iniciar el proyecto

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar el servidor de desarrollo
npm run dev
```

El servidor de desarrollo se ejecuta en `http://localhost:5173`.

### Conexión con el backend

El backend debe estar corriendo y permitir el origen del frontend por CORS:

```bash
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173 python manage.py runserver
```

Si el navegador muestra «No pudimos conectar con el servidor» aunque el backend esté activo, casi siempre es CORS: revisa que `CORS_ALLOWED_ORIGINS` incluya el origen exacto desde el que abres el frontend. Tras cambiar `.env`, reinicia `npm run dev`.

## Scripts disponibles

| Comando          | Descripción                                    |
| ---------------- | ---------------------------------------------- |
| `npm run dev`    | Inicia el servidor de desarrollo (Vite + HMR). |
| `npm run build`  | Compila la aplicación para producción en `dist/`. |
| `npm run preview`| Previsualiza el build de producción localmente. |
| `npm run lint`   | Ejecuta ESLint sobre el proyecto.              |

## Build de producción

```bash
npm run build
npm run preview
```