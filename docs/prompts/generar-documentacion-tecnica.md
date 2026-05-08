# Prompt — Generar documentación técnica con diagramas profesionales

> Plantilla reutilizable para producir un PDF de documentación técnica de cualquier
> proyecto, con diagramas C4 generados como HTML+SVG (skill `architecture-diagram`)
> y embebidos en el PDF final.
>
> **Uso:** copia este archivo a `docs/prompts/` del proyecto destino y pásalo como
> instrucción a Claude Code. Reemplaza los marcadores `[…]` por valores del proyecto.

---

## Objetivo

Generar (o regenerar) la documentación técnica del proyecto en un único PDF profesional
con:

1. Portada con metadatos del proyecto.
2. Secciones técnicas a partir de los `.md` existentes.
3. **4 diagramas C4** en cada nivel (Contexto, Contenedores, Componentes, Despliegue),
   creados con la skill `architecture-diagram` (HTML+SVG en tema oscuro).
4. Tablas, bloques de código, blockquotes y paginación con estilo coherente.

**No** debes inventar arquitectura: lee primero `CLAUDE.md`, `README.md`, `package.json`/`pom.xml`/`pyproject.toml`,
`docker-compose.yml`, archivos de infra y los `*.md` ya existentes.

---

## Entradas mínimas que necesitas leer del proyecto

| Archivo | Para extraer |
|---|---|
| `CLAUDE.md` raíz | Stack, módulos, convenciones, comandos |
| `README.md` raíz | Resumen de alto nivel, comandos de arranque |
| `apps/*/CLAUDE.md`, `packages/*/CLAUDE.md` (si monorepo) | Detalles por capa |
| `docs/architecture.md` o equivalente | Flujos existentes |
| `docs/decisions/*.md`, `docs/runbooks/*.md` | ADRs y operación |
| `package.json` / `pom.xml` / `requirements.txt` | Dependencias clave, versiones |
| `Dockerfile`, `docker-compose.yml`, `.github/workflows/*` | Topología de despliegue |
| Código en `src/` solo si necesitas confirmar componentes | Routers, services, módulos |

Si falta información crítica para un diagrama, **pregunta al usuario** antes de inventar.

---

## Plan de ejecución (en este orden)

### Paso 0 — Inventario y preguntas

1. Lista los `.md` existentes y los PDFs en `docs/pdf/` (si existen).
2. Detecta el stack (frontend, backend, base de datos, auth, despliegue).
3. Si hay diagramas previos en `docs/diagrams/`, identifica formato (drawio, mermaid,
   PlantUML, png, svg). Conserva originales en `_legacy-*/`.
4. Pregunta al usuario solo si:
   - Falta el módulo de despliegue (no hay Dockerfile ni IaC).
   - Hay ambigüedad entre dos arquitecturas posibles.
   - No queda claro qué actores externos usar.

### Paso 1 — Crear los 4 diagramas C4 con la skill

Invoca `Skill(architecture-diagram)` y crea **un HTML por nivel** en `docs/diagrams/`:

- `01-context.html` — actores y sistemas externos.
- `02-containers.html` — frontend, backend, datos, edge.
- `03-components.html` — pipeline interno del backend (routers → controllers → services → datos).
- `04-deployment.html` — infraestructura (CDN, compute, datos, SaaS, secretos, CI/CD).

**Convenciones de la skill (obligatorias):**

- Fondo `#020617` con grid `#1e293b` 40px.
- Tipografía `JetBrains Mono` (Google Fonts).
- Paleta semántica:
  - cyan `#22d3ee` → frontend / edge
  - emerald `#34d399` → backend / compute
  - violet `#a78bfa` → datos / persistencia
  - rose `#fb7185` → seguridad / auth
  - amber `#fbbf24` → cloud / SaaS externo
  - slate `#94a3b8` → externos genéricos / actores
- Boundaries con `stroke-dasharray="8,4"` para zonas (Edge / Cloud / Firebase…).
- Flechas con `<marker>` por color, **dibujadas antes** de los nodos para z-order correcto.
- Cuando un nodo tiene `fill` semitransparente y se solapa con flechas, dibujar primero
  un `<rect fill="#0f172a">` opaco para enmascarar.
- Cards informativas (3) debajo del SVG con resumen de capas.
- Leyenda al pie del SVG con bloques de color y tipos de flujo.
- `pulse-dot` animado en el header.

**Cada HTML debe ser autocontenido**: CSS inline, sin JS, sin imágenes externas
(salvo Google Fonts).

### Paso 2 — Renderizar HTML → PNG

Necesitamos PNGs porque el PDF final embebe imágenes, no HTML.

```bash
# Usar Firefox headless (snap o nativo). Escribir a $HOME (snap no puede a /tmp).
for n in 01-context 02-containers 03-components 04-deployment; do
  firefox --headless --screenshot "$(pwd)/docs/diagrams/${n}.png" \
          --window-size=1400,1200 \
          "file://$(pwd)/docs/diagrams/${n}.html"
done
```

**Fallbacks (en orden de preferencia)** si Firefox falla con
`RenderCompositorSWGL failed` u otro error de snap:

1. `firefox --profile <dir-temporal>` con perfil aislado.
2. `chromium --headless --screenshot=...` si está instalado.
3. `npx playwright install chromium && node -e "..."` con Playwright.
4. `weasyprint <html> -o <pdf>` y luego `pdftoppm -r 200` para extraer PNG.

**Backup obligatorio:** mover los PNG previos a `docs/diagrams/_legacy-*/` antes de sobreescribir.

### Paso 3 — Markdown → HTML para impresión

Concatena los `.md` relevantes en un único `documentacion-tecnica.md` (si no existe),
con esta estructura mínima:

```
1. Portada (tabla con metadatos)
2. Resumen ejecutivo
3. Objetivos
4. Alcance del MVP
5. Stack técnico
6. Arquitectura
   6.1 Visión general
   6.2 Diagrama de contexto (C4 — Nivel 1)   ← ![alt](diagrams/01-context.png)
   6.3 Diagrama de contenedores (C4 — Nivel 2) ← ![alt](diagrams/02-containers.png)
   6.4 Diagrama de componentes (C4 — Nivel 3)  ← ![alt](diagrams/03-components.png)
   6.5 Diagrama de despliegue                  ← ![alt](diagrams/04-deployment.png)
7. Modelo de datos
8. Autenticación y autorización
9. APIs / contratos
10. Despliegue y operaciones
11. Convenciones de código
12. Roadmap / pendientes
```

Convierte a HTML con tablas y soporte GFM:

```python
# /home/<user>/.cache/render-pdf.py — adaptable
from markdown_it import MarkdownIt
from pathlib import Path

md = (MarkdownIt("commonmark", {"html": True, "linkify": False})
      .enable("table").enable("strikethrough"))
body = md.render(Path("docs/documentacion-tecnica.md").read_text())

CSS = r"""
@page { size: A4; margin: 18mm 16mm 20mm 16mm;
        @bottom-right { content: counter(page) " / " counter(pages);
                        font-size: 9pt; color: #64748b; } }
html, body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
             font-size: 10.5pt; line-height: 1.55; color: #0f172a; }
h1 { color: #0c4a6e; border-bottom: 3px solid #0ea5e9; }
h2 { color: #0c4a6e; border-bottom: 1px solid #cbd5e1; page-break-after: avoid; }
code { font-family: "JetBrains Mono", Consolas, monospace; background: #f1f5f9;
       padding: 1px 5px; border-radius: 3px; border: 1px solid #e2e8f0; font-size: 9pt; }
pre { background: #0f172a; color: #e2e8f0; padding: 10pt 12pt; border-radius: 6px;
      font-size: 8.5pt; page-break-inside: avoid; }
table { width: 100%; border-collapse: collapse; font-size: 9.5pt; page-break-inside: avoid; }
thead { background: #0c4a6e; color: white; }
th, td { border: 1px solid #cbd5e1; padding: 5pt 8pt; vertical-align: top; }
tbody tr:nth-child(even) { background: #f8fafc; }
img { max-width: 100%; display: block; margin: 12pt auto;
      border: 1px solid #e2e8f0; border-radius: 4px; page-break-inside: avoid; }
blockquote { border-left: 3px solid #0ea5e9; background: #f0f9ff;
             padding: 6pt 12pt; color: #075985; }
"""
COVER = """<div style='page-break-after: always; text-align:center; padding-top:20vh;'>
  <h1 style='font-size:28pt;'>[NOMBRE PROYECTO]</h1>
  <div style='color:#475569;font-size:13pt;'>Documentación Técnica</div>
  <div style='display:inline-block;text-align:left;border:1px solid #cbd5e1;
              border-radius:8px;padding:18px 28px;margin-top:40px;background:#f8fafc;'>
    <div><b>Versión:</b> [X.Y.Z]</div>
    <div><b>Fecha:</b> [YYYY-MM-DD]</div>
    <div><b>Autor:</b> [Nombre]</div>
    <div><b>Stack:</b> [Stack]</div>
  </div>
</div>"""
out = f"<!DOCTYPE html><html><head><meta charset='UTF-8'><style>{CSS}</style></head><body>{COVER}{body}</body></html>"
Path("docs/_print.html").write_text(out)
```

### Paso 4 — HTML → PDF con WeasyPrint

WeasyPrint es la opción **recomendada** sobre Firefox/Chromium porque:
- Honra `@page` y `page-break-*` correctamente.
- No requiere navegador ni sandbox.
- Genera PDFs taggeables y con metadatos.

```bash
# Instalar en venv (evita PEP 668 sin sudo)
python3 -m venv ~/.cache/weasy-venv
~/.cache/weasy-venv/bin/pip install --quiet weasyprint

# Generar PDF (resolver imágenes con base_url)
~/.cache/weasy-venv/bin/python -c "
from weasyprint import HTML
HTML('docs/_print.html', base_url='docs').write_pdf('docs/pdf/documentacion-tecnica.pdf')
"
```

**Backup**: si ya existe un PDF previo, muévelo a
`docs/pdf/documentacion-tecnica.pdf.legacy-<fecha>` antes de sobreescribir.

### Paso 5 — Verificación

```bash
pdfinfo docs/pdf/documentacion-tecnica.pdf | head           # páginas, productor
pdfimages -list docs/pdf/documentacion-tecnica.pdf | head    # confirma 4 imágenes 1400x1200
pdftoppm -r 100 -f 5 -l 5 docs/pdf/documentacion-tecnica.pdf /tmp/preview -png
# Abre /tmp/preview-05.png para inspección visual del primer diagrama
```

Criterios de aceptación:

- [ ] PDF tiene portada + ≥ 1 página por sección + paginación `n / total`.
- [ ] Las 4 imágenes embebidas son los HTML del skill (no exports drawio antiguos).
- [ ] Tablas, code blocks, blockquotes y headings con estilo aplicado.
- [ ] Producer es `WeasyPrint X.Y` (no `Skia/PDF` ni `Cairo`).
- [ ] Tamaño del PDF razonable (< 5 MB para docs de proyecto MVP).
- [ ] No hay imágenes rotas (`pdfimages -list` lista los 4 esperados).

### Paso 6 — Limpieza

```bash
rm -f docs/_print.html        # archivo intermedio
# Conservar:
#   - docs/diagrams/*.html (fuente del skill)
#   - docs/diagrams/*.png   (renders nuevos)
#   - docs/diagrams/_legacy-*/  (backups)
#   - docs/pdf/*.pdf.legacy-*   (backups)
```

---

## Tooling: matriz de decisión con fallbacks

| Necesidad | Primera opción | Fallback 1 | Fallback 2 |
|---|---|---|---|
| MD → HTML con tablas | `markdown-it-py` (`.enable('table')`) | `pandoc -f gfm -t html` | `marked` (npm) |
| HTML → PNG (diagramas) | `firefox --headless --screenshot` (escribiendo a `$HOME`) | `chromium --headless --screenshot=` | Playwright/Puppeteer |
| HTML → PDF (documento) | **WeasyPrint** en venv | `firefox --headless --print-to-pdf` con `--profile` aislado | `wkhtmltopdf` |
| Inspección de PDF | `pdfinfo`, `pdfimages -list`, `pdftoppm` | `qpdf --show-pages` | abrir en visor |

Trampas conocidas:

- **Firefox snap** no puede escribir en `/tmp` ni en rutas fuera de `$HOME`. Usa siempre rutas en `~`.
- **Firefox snap** falla con `RenderCompositorSWGL` si ya hay otro Firefox abierto.
  Solución: `--profile /tmp/ff-isolated` (en `$HOME`).
- **`pip install` global** falla con PEP 668 en distros recientes. Siempre usa `python3 -m venv`.
- **WeasyPrint** y rutas relativas: pasa `base_url="docs"` para que `diagrams/01-context.png` resuelva.

---

## Convenciones de salida

Estructura final esperada en el repo:

```
docs/
├── architecture.md
├── documentacion-tecnica.md          # fuente para el PDF
├── decisions/                         # ADRs
├── runbooks/                          # operación
├── diagrams/
│   ├── 0[1-4]-*.html                 # fuente skill (autocontenida)
│   ├── 0[1-4]-*.png                  # renders del HTML (1400x1200)
│   ├── 0[1-4]-*.spec.yaml            # opcional: spec declarativa
│   └── _legacy-*/                    # backups si los hubo
├── pdf/
│   ├── documentacion-tecnica.pdf     # producido por WeasyPrint
│   └── *.pdf.legacy-*                # backups
└── prompts/
    └── generar-documentacion-tecnica.md  # este archivo
```

---

## Resumen para el agente

1. **No inventes**: lee primero el repo y pregunta lo ambiguo.
2. **4 HTML con la skill** `architecture-diagram` siguiendo la paleta y convenciones.
3. **PNG con Firefox headless** (escribir a `$HOME`), backup de los anteriores.
4. **MD → HTML → PDF** con `markdown-it-py` + WeasyPrint (en venv).
5. **Verifica con `pdfimages -list`** que las 4 imágenes son las nuevas.
6. **Conserva backups** de PDFs y PNGs originales.
7. **Limpia** archivos intermedios al terminar.

Reporta al final: número de páginas, tamaño del PDF, ruta de los archivos generados,
y rutas de los backups.
