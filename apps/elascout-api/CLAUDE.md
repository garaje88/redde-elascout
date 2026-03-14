# Backend — Express + TypeScript + Firebase Admin SDK

## Stack
- Node.js + Express + TypeScript
- Firebase Admin SDK para verificar tokens y acceder a Firestore
- tsx para desarrollo con hot-reload

## Estructura
```
src/
├── config/        # Firebase Admin SDK init, variables de entorno
├── middleware/     # authMiddleware (token verify), errorHandler
├── routes/        # Definición de rutas por módulo
├── controllers/   # Manejan request/response, validan input
├── services/      # Lógica de negocio, queries a Firestore
├── models/        # Interfaces y tipos TypeScript
└── utils/         # Helpers compartidos
```

## Endpoints Principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/verify | Verificar token, auto-crear usuario |
| GET | /api/athletes | Listar deportistas (con filtros) |
| POST | /api/athletes | Crear deportista |
| GET | /api/athletes/:id | Detalle de deportista |
| PUT | /api/athletes/:id | Actualizar deportista |
| DELETE | /api/athletes/:id | Eliminar deportista |
| GET | /api/athletes/:id/evaluations | Listar evaluaciones |
| POST | /api/athletes/:id/evaluations | Crear evaluación |
| POST | /api/organizations | Crear organización |
| POST | /api/organizations/join | Unirse con código |
| GET | /api/organizations/:orgId/members | Listar miembros |

## Patrón

```
route → controller → service → Firestore
```

## Auth
- POST /api/auth/verify recibe idToken de Google, verifica con Admin SDK
- Auto-crea usuario en Firestore si no existe
- Middleware `authMiddleware` protege el resto de rutas
- El UID se inyecta en `req.uid`
