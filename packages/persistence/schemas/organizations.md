# Colección: organizations/{orgId}

## Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|:---------:|-------------|
| name | string | ✅ | Nombre de la organización |
| inviteCode | string | ✅ | Código único de invitación (6 chars) |
| createdBy | string | ✅ | UID del creador (admin) |
| logoURL | string | ❌ | Logo de la organización |
| createdAt | timestamp | ✅ | Fecha de creación |
| updatedAt | timestamp | ✅ | Última actualización |

## Subcolección: members/{uid}

| Campo | Tipo | Requerido | Descripción |
|-------|------|:---------:|-------------|
| uid | string | ✅ | UID del usuario |
| displayName | string | ✅ | Nombre (desnormalizado) |
| email | string | ✅ | Email (desnormalizado) |
| role | string | ✅ | `"admin"`, `"coach"`, `"scout"`, `"viewer"` |
| joinedAt | timestamp | ✅ | Fecha de incorporación |

## Notas
- El creador se auto-añade como miembro con rol `admin`
- `inviteCode` se genera automáticamente y es único
- Los miembros se almacenan como subcolección para queries eficientes
