# ElaScout — Athlete Intelligence Platform

Plataforma de gestión, evaluación y análisis de deportistas de alto rendimiento.
MVP enfocado en Fútbol/Soccer. Centraliza perfiles, evaluaciones estandarizadas y gestión de organizaciones deportivas.

## Stack

| Capa | Tecnología | Deploy |
|------|-----------|--------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS | Vercel |
| Backend | Node.js + Express + TypeScript | Cloud Run |
| Base de datos | Firebase Firestore (NoSQL) | Google Cloud |
| Auth | Auth.js v5 (Google OAuth) + Firebase Admin SDK (backend) | — |
| Storage | Firebase Storage | Google Cloud |
| Monorepo | Turborepo | — |

## Estructura del Monorepo (Turborepo)

```
apps/
├── elascout-web/     # Frontend Next.js 14 — App Router, Auth.js, componentes
├── elascout-api/     # Backend Express — rutas, controladores, servicios
packages/
├── persistence/      # Capa de datos — esquema Firestore, reglas, índices
```

## Módulos MVP

- **M1-Personal:** Nombre, fecha nacimiento, nacionalidad, contacto
- **M2-Profesional:** Posición, pie, estatura, peso, club, contrato
- **M3-Historial:** Timeline de clubes anteriores
- **M4-Títulos:** Reconocimientos y logros
- **M5-Físico:** 8 atributos (0-100): velocidad, aceleración, fuerza, resistencia, potencia, reacción, saques largos/cortos. Radar chart. Campos condicionales para porteros
- **M6-Evaluaciones:** 3 tipos (física, técnica, táctica). Puntajes 0-100, evaluador, fecha, notas. Gráfico de evolución temporal
- **Auth:** Auth.js v5 con Google en frontend. Firebase Admin SDK en backend para verificar tokens y acceder a Firestore. Auto-creación de usuario en Firestore
- **Organizaciones:** Crear org, código de invitación, roles (admin, coach, scout, viewer)
- **Dashboard:** KPIs y métricas de uso (post-MVP v1.1)

## Actores

Scout deportivo, Director técnico, Preparador físico, Representante, Admin de club

## Convenciones

- TypeScript strict en todo el proyecto
- Tailwind CSS para estilos (no CSS modules ni styled-components)
- Auth.js v5 en frontend para login con Google
- Firebase Admin SDK en backend para verificar tokens y acceder a Firestore
- Patrón backend: route → controller → service → Firestore
- Frontend mobile-first y responsive
- Nombres de archivos: kebab-case
- Componentes React: PascalCase
- Variables y funciones: camelCase

## Comandos de Desarrollo

```bash
# Instalar dependencias (desde raíz)
npm install

# Desarrollo (todas las apps en paralelo)
npm run dev

# Build completo
npm run build

# Lint
npm run lint

# Filtrar por app
npx turbo run dev --filter=elascout-web
npx turbo run dev --filter=elascout-api
```
