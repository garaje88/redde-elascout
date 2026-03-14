# ElaScout

Plataforma de gestión, evaluación y análisis de deportistas de alto rendimiento (MVP: Fútbol/Soccer).

Reemplaza procesos manuales (Excel, cuadernos) con una plataforma digital que centraliza:
- Perfiles completos de deportistas (datos personales, profesionales, historial, títulos)
- Evaluaciones estandarizadas (física, técnica, táctica) con puntajes 0-100
- Capacidades físicas con visualización radar chart
- Gestión de organizaciones deportivas con roles y permisos
- Evolución temporal de rendimiento

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS → Vercel
- **Backend:** Node.js + Express + TypeScript → Cloud Run
- **Database:** Firebase Firestore
- **Auth:** Firebase Auth (Google/Gmail) + JWT
- **Storage:** Firebase Storage

## Estructura

```
src/api/          # Backend Express
src/web/          # Frontend Next.js 14
src/persistence/  # Capa de datos Firebase
docs/             # Documentación y ADRs
```

## Módulos MVP

| Módulo | Descripción |
|--------|-------------|
| M1-Personal | Datos personales del deportista |
| M2-Profesional | Posición, físico, club, contrato |
| M3-Historial | Timeline de clubes anteriores |
| M4-Títulos | Reconocimientos y logros |
| M5-Físico | 8 atributos (0-100) con radar chart |
| M6-Evaluaciones | Física, técnica, táctica con evolución temporal |
