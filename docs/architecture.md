# Arquitectura ElaScout

## Diagrama General

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Cliente    │────▶│  Next.js (Vercel) │────▶│ Express API      │
│   Browser    │◀────│  App Router       │◀────│ (Cloud Run)      │
└─────────────┘     └──────────────────┘     └────────┬─────────┘
                                                       │
                                                       ▼
                                              ┌──────────────────┐
                                              │    Firestore      │
                                              │   + Storage       │
                                              └──────────────────┘
```

## Flujo de Autenticación

1. Usuario hace login con Google en el frontend (Firebase Auth SDK)
2. Firebase Auth devuelve un ID Token (JWT)
3. Frontend envía JWT en header `Authorization: Bearer <token>` a la API
4. API verifica JWT con Firebase Admin SDK
5. Si el usuario no existe en Firestore, se auto-crea en la colección `users`
6. API responde con datos del usuario y su rol

## Modelo de Datos Firestore

### Colecciones principales

- **users/{uid}** — Perfil del usuario autenticado, modo (individual/org), rol
- **athletes/{id}** — Datos del deportista (M1-M4), capacidades físicas (M5), creador
- **organizations/{orgId}** — Nombre, miembros, roles, código de invitación

### Subcolecciones

- **athletes/{id}/evaluations/{evalId}** — Evaluaciones (M6): tipo, puntajes, evaluador, fecha, notas

### Relaciones

- `users.uid` ↔ Firebase Auth UID
- `athletes.createdBy` → `users.uid`
- `athletes.organizationId` → `organizations.orgId` (opcional)
- `organizations.members[].uid` → `users.uid`

## Flujo de Onboarding

### Individual
1. Login con Google → auto-creación en `users` con `mode: "individual"`
2. Redirige a dashboard personal
3. Puede crear deportistas propios

### Organización
1. Login con Google → auto-creación en `users`
2. Opción A: Crear organización → `mode: "organization"`, rol `admin`
3. Opción B: Unirse con código de invitación → se añade como miembro

## Roles y Permisos

| Rol | Crear atleta | Evaluar | Ver todo | Gestionar org |
|-----|:---:|:---:|:---:|:---:|
| admin | ✅ | ✅ | ✅ | ✅ |
| coach | ✅ | ✅ | ✅ | ❌ |
| scout | ✅ | ✅ | ✅ | ❌ |
| viewer | ❌ | ❌ | ✅ | ❌ |
