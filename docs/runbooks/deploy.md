# Deploy — ElaScout

## Frontend (Vercel)

1. Push a `main` dispara deploy automático en Vercel
2. Variables de entorno requeridas en Vercel:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_API_URL` (URL del backend en Cloud Run)

## Backend (Cloud Run)

1. Build de imagen Docker desde `src/api/`
2. Push a Google Container Registry
3. Deploy a Cloud Run con variables de entorno:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_SERVICE_ACCOUNT` (JSON de la service account)
   - `CORS_ORIGIN` (URL del frontend en Vercel)

## Firebase

1. Deploy de reglas: `firebase deploy --only firestore:rules`
2. Deploy de índices: `firebase deploy --only firestore:indexes`

## Checklist Pre-Deploy

- [ ] Tests pasan localmente
- [ ] Variables de entorno configuradas
- [ ] Reglas de Firestore actualizadas si hubo cambios en el esquema
- [ ] Build exitoso sin errores de TypeScript
