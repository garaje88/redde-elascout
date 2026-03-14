# Colección: athletes/{id}

## Campos

### M1 — Personal
| Campo | Tipo | Requerido | Descripción |
|-------|------|:---------:|-------------|
| firstName | string | ✅ | Nombre |
| lastName | string | ✅ | Apellido |
| dateOfBirth | timestamp | ✅ | Fecha de nacimiento |
| nationality | string | ✅ | Nacionalidad |
| contactEmail | string | ❌ | Email de contacto |
| contactPhone | string | ❌ | Teléfono |
| photoURL | string | ❌ | Foto del deportista |

### M2 — Profesional
| Campo | Tipo | Requerido | Descripción |
|-------|------|:---------:|-------------|
| position | string | ✅ | Posición principal |
| secondaryPosition | string | ❌ | Posición secundaria |
| preferredFoot | string | ✅ | `"left"`, `"right"`, `"both"` |
| height | number | ✅ | Estatura en cm |
| weight | number | ✅ | Peso en kg |
| currentClub | string | ❌ | Club actual |
| contractEnd | timestamp | ❌ | Fin de contrato |

### M3 — Historial
| Campo | Tipo | Requerido | Descripción |
|-------|------|:---------:|-------------|
| clubHistory | array | ❌ | Array de `{ club, from, to, role }` |

### M4 — Títulos
| Campo | Tipo | Requerido | Descripción |
|-------|------|:---------:|-------------|
| titles | array | ❌ | Array de `{ name, year, club, description }` |

### M5 — Capacidades Físicas
| Campo | Tipo | Requerido | Descripción |
|-------|------|:---------:|-------------|
| physical.speed | number | ❌ | Velocidad (0-100) |
| physical.acceleration | number | ❌ | Aceleración (0-100) |
| physical.strength | number | ❌ | Fuerza (0-100) |
| physical.endurance | number | ❌ | Resistencia (0-100) |
| physical.power | number | ❌ | Potencia (0-100) |
| physical.reaction | number | ❌ | Reacción (0-100) |
| physical.longThrow | number | ❌ | Saques largos (0-100) |
| physical.shortThrow | number | ❌ | Saques cortos (0-100) |
| isGoalkeeper | boolean | ❌ | Si es portero, habilita campos adicionales |

### Metadatos
| Campo | Tipo | Requerido | Descripción |
|-------|------|:---------:|-------------|
| createdBy | string | ✅ | UID del usuario creador |
| organizationId | string | ❌ | ID de la organización |
| createdAt | timestamp | ✅ | Fecha de creación |
| updatedAt | timestamp | ✅ | Última actualización |
