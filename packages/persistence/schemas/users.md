# Colección: users/{uid}

## Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|:---------:|-------------|
| uid | string | ✅ | Firebase Auth UID |
| email | string | ✅ | Email del usuario |
| displayName | string | ✅ | Nombre completo |
| photoURL | string | ❌ | URL de foto de perfil (Google) |
| mode | string | ✅ | `"individual"` o `"organization"` |
| organizationId | string | ❌ | ID de org si mode es organization |
| role | string | ❌ | Rol dentro de la org (admin, coach, scout, viewer) |
| createdAt | timestamp | ✅ | Fecha de creación |
| updatedAt | timestamp | ✅ | Última actualización |

## Notas
- Se auto-crea al primer login con Google
- El `uid` del documento coincide con el UID de Firebase Auth
- `mode` se establece durante el onboarding
