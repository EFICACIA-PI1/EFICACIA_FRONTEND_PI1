# EFICACIA_FRONTEND_PI1

Frontend del mini proyecto **EFICACIA · Organizador de eventos independientes**. Aplicación de una sola página (SPA) construida con React + Vite que permite crear eventos, gestionar el plan logístico (gestiones), marcar tareas como hechas, diferirlas y visualizar el progreso de cada evento.

## Funcionalidades

- **Hoy** (`/hoy`): prioridades del día (vencidas, urgentes, sobrecargas de horas) y conflictos de horas planificadas.
- **Eventos** (`/eventos`): listado de eventos con barra de progreso.
- **Crear** (`/crear`): formulario para registrar un nuevo evento.
- **Detalle** (`/evento/:id`): gestión de las tareas del evento (crear, editar, completar, diferir, eliminar) con validación del límite diario de horas.
- **Progreso** (`/progreso`): seguimiento del avance general.

Los datos se persisten en `localStorage` (`eficacia.events.v1` / `eficacia.gestiones.v1`) mediante el servicio mock `src/services/eventService.js`, que simula la latencia de una API y se siembra con datos de ejemplo al primer arranque.

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
| `VITE_API_URL`   | URL base de la API del backend (solo las que empiezan con `VITE_` son expuestas al cliente). | `http://localhost:8000/api/` |

## Cómo iniciar el proyecto

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar el servidor de desarrollo
npm run dev
```

El servidor de desarrollo se ejecuta en `http://localhost:5173`.

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