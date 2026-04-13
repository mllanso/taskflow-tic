# TaskFlow TIC — Nordelta 2026

Gestión de tareas integrada con Google Tasks.

---

## Instalación rápida

```bash
# 1. Entrar a la carpeta
cd taskflow

# 2. Instalar dependencias
npm install

# 3. Completar las variables de entorno
# Editar .env.local con tu Client ID y Client Secret de Google Cloud

# 4. Correr en modo desarrollo
npm run dev
```

Abrí http://localhost:3000 en tu navegador.

---

## Configuración de Google Cloud (hacer una sola vez)

1. Ir a https://console.cloud.google.com
2. Crear proyecto → "TaskFlow TIC"
3. APIs y servicios → Biblioteca → buscar "Google Tasks API" → Habilitar
4. APIs y servicios → Credenciales → Crear → ID de cliente OAuth → Aplicación web
5. Agregar origen autorizado: http://localhost:3000
6. Agregar URI de redireccionamiento: http://localhost:3000/api/auth/callback/google
7. Copiar Client ID y Client Secret → pegarlos en .env.local

---

## Formato de tareas en Google Tasks

Cada tarea debe tener en el campo "Notas":

```
assignee:JC | prioridad:alta
```

Usuarios disponibles: JC, MV, LR, AR, SP

Prioridades: alta, media, baja

Para marcar como "En proceso" agregá al final: `| en-proceso`

---

## Estructura de archivos

```
taskflow/
├── pages/
│   ├── index.js              ← Dashboard principal
│   ├── _app.js               ← Wrapper de la app
│   └── api/
│       ├── auth/
│       │   └── [...nextauth].js  ← OAuth con Google
│       └── tasks/
│           ├── index.js      ← GET: traer todas las tareas
│           ├── [id].js       ← PATCH: actualizar estado
│           └── create.js     ← POST: crear nueva tarea
├── styles/
│   └── globals.css
├── .env.local                ← Credenciales (NO subir a Git)
└── package.json
```
