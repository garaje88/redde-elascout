# Persistence — Firebase Firestore

## Esquema NoSQL

### Colecciones Principales

| Colección | Documento | Descripción |
|-----------|-----------|-------------|
| `users/{uid}` | Perfil de usuario | Auth UID, nombre, email, modo, rol |
| `athletes/{id}` | Deportista | M1-M4, capacidades físicas (M5), creador |
| `organizations/{orgId}` | Organización | Nombre, miembros, roles, código de invitación |

### Subcolecciones

| Subcolección | Padre | Descripción |
|-------------|-------|-------------|
| `evaluations/{evalId}` | `athletes/{id}` | Evaluaciones M6: tipo, puntajes, evaluador |

## Reglas de Seguridad

Basadas en roles dentro de organizaciones:
- **admin:** CRUD completo + gestión de org
- **coach/scout:** CRUD de atletas y evaluaciones
- **viewer:** Solo lectura

Usuarios individuales solo acceden a sus propios datos.

## Índices

Definidos en `firestore.indexes.json` para queries frecuentes:
- Atletas por organización + fecha de creación
- Evaluaciones por tipo + fecha
