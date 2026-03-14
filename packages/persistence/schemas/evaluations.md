# Subcolección: athletes/{id}/evaluations/{evalId}

## Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|:---------:|-------------|
| type | string | ✅ | `"physical"`, `"technical"`, `"tactical"` |
| scores | map | ✅ | Mapa de atributo → puntaje (0-100) |
| overallScore | number | ✅ | Puntaje general calculado |
| evaluatorId | string | ✅ | UID del evaluador |
| evaluatorName | string | ✅ | Nombre del evaluador (desnormalizado) |
| date | timestamp | ✅ | Fecha de la evaluación |
| notes | string | ❌ | Observaciones del evaluador |
| createdAt | timestamp | ✅ | Fecha de creación del registro |

## Atributos por Tipo de Evaluación

### Physical
velocidad, aceleración, fuerza, resistencia, potencia, reacción, saques largos, saques cortos

### Technical
control, pase corto, pase largo, regate, tiro, cabeceo, centros, visión de juego

### Tactical
posicionamiento, lectura de juego, presión, transiciones, juego aéreo, comunicación, disciplina táctica, adaptabilidad

## Notas
- `scores` es un mapa flexible para soportar distintos atributos según `type`
- `overallScore` se calcula como promedio de los scores
- Se usa para gráficos de evolución temporal (M6)
