# ADR-001: Estructura Monorepo

## Estado
Aceptada

## Contexto
ElaScout tiene frontend (Next.js), backend (Express) y capa de datos (Firebase). Necesitamos decidir cómo organizar el código.

## Decisión
Monorepo con estructura `src/` dividida en tres módulos: `api`, `web`, `persistence`. Sin herramientas de monorepo (Turborepo, Nx) por ahora — carpetas simples dentro de un solo repositorio.

## Razones
- Equipo pequeño, un solo repo simplifica el flujo
- Tipos TypeScript compartidos entre frontend y backend
- Deploy independiente: Vercel (web) y Cloud Run (api)
- Firebase config centralizada en `persistence/`
- Se puede migrar a Turborepo más adelante si crece la complejidad

## Consecuencias
- Cada módulo tendrá su propio `package.json` (al inicializar)
- Los tipos compartidos vivirán en `src/persistence/schemas/` o un futuro `src/shared/`
- CI/CD deberá manejar builds independientes
