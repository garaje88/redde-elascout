# Frontend — Next.js 14 + TypeScript + Tailwind + Auth.js v5

## Stack
- Next.js 14 con App Router
- TypeScript strict
- Tailwind CSS para estilos
- Auth.js v5 con Google provider (reemplaza Firebase Auth directo en cliente)

## Estructura de Rutas (App Router)

```
app/
├── api/auth/[...nextauth]/   # Auth.js route handler
├── auth/signin/              # Login con Google
├── onboarding/               # Selección de modo (individual vs org)
├── (dashboard)/              # Panel principal con KPIs
└── athletes/                 # CRUD deportistas
    └── [id]/                 # Detalle: perfil, físico, evaluaciones, historial
```

## Auth

- Auth.js v5 maneja login con Google OAuth
- Middleware protege rutas automáticamente
- Sesión JWT con extensiones de tipo para rol, modo y organizationId
- Archivo de config: `auth.ts` en raíz del workspace

## Componentes Clave

- **Radar Chart (M5):** Visualización de 8 atributos físicos en gráfico radar
- **Evolución temporal (M6):** Gráfico de líneas con evaluaciones a lo largo del tiempo
- **Perfil de deportista:** Tabs para M1-M6 en la vista de detalle
- **Formularios de evaluación:** Sliders/inputs 0-100 por atributo
- **Onboarding:** Selección individual vs organización (crear/unirse)

## Convenciones

- Mobile-first, responsive con breakpoints de Tailwind
- Componentes server por defecto, `"use client"` solo cuando sea necesario
- Custom hooks para lógica de data fetching
- Loading states con Suspense y loading.tsx
