# Dashboard IA: USIL vs mercado (3 segmentos)

Vite + React + Tailwind v4 + Recharts + Motion. Sin backend: los datos viven en `src/*.json`.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/
```

## Segmentos

Una sola app con tres formas de análisis, elegibles en la barra lateral y enlazables con `?seg=`:

| `?seg=` | Vista | Benchmark USIL | Datos | Acciones |
|---|---|---|---|---|
| (ninguno) o `ec` | Educación continua | USIL | `src/data.json` · 905 programas, 6 universidades | `src/acciones.js` |
| `institutos` | Institutos | USIL IE (Instituto de Emprendedores) | `src/data_institutos.json` · 513 programas, 6 institutos | `src/acciones_institutos.js` |
| `posgrado` | Posgrado | USIL EPG (Escuela de Postgrado) | `src/data_posgrado.json` · 710 programas, 6 escuelas | `src/acciones_posgrado.js` |

Educación continua conserva sus 6 secciones, su ficha por línea de carrera y sus cifras. Institutos y posgrado
tienen 6 secciones propias (`src/segmento.jsx`), sin precio (ninguno de los dos segmentos lo publica de forma
comparable) y con un panel final "Qué no dice este dato" con los límites del crawl.

Cada gráfico de las tres vistas, y cada uno de sus 5 KPI, tiene un icono ⓘ (`help` en `Panel` y en `Kpi`,
`src/ui.jsx`, mismo icono y mismo recuadro): al pasar el mouse o enfocar con teclado muestra qué muestra, cómo
leerlo y qué mirar, en frases de una línea sin jerga ni cifras inventadas, pensadas para un directivo. Los textos
viven junto a cada uso de `Panel`/`Kpi` en `App.jsx`, `segmento.jsx` y `ficha.jsx`.

Los títulos de la barra lateral (`SECTIONS` / `seccionesDe` en `App.jsx`) son cortos a propósito, para caber en una
línea a 240px; los títulos largos y explicativos van en `<SectionTitle>`, dentro de la página.

Las filas y las acciones de los dos segmentos nuevos viajan en un chunk perezoso (`lazy(() => import('./segmento'))`):
abrir educación continua no las descarga. `src/segmentos_meta.json` (título, benchmark, fecha y opciones del filtro)
sí es estático, porque lo usa la barra lateral.

## Regenerar datos

```bash
python scripts/build_data.py                      # educación continua -> src/data.json
python scripts/build_segment.py                   # los dos segmentos nuevos
python scripts/build_segment.py institutos        # solo uno
python scripts/build_segment.py --grupos          # imprime cada tipo de curso IA con sus cursos, para revisarlo a mano
```

`scripts/comun.py` tiene lo que comparten los tres segmentos: normalización de texto, las 17 líneas de carrera con su
clasificador por palabras clave, horas y precio de lista. Si cambia una palabra clave, cambia en los tres.

`build_segment.py` lee `../Institutos/00_Data/processed/programas_*.json` y `../Posgrado/00_Data/processed/programas_*.json`,
y escribe filas con el mismo esquema que `data.json` (`u, n, l, t, ia, p, h, ph, g, m, d, url`) más:

- `id` — identificador estable `archivo#índice`. Ni la URL ni el nombre son únicos: USIL EPG repite la URL de la
  categoría en sus 53 programas de educación ejecutiva, y hay nombres repetidos en CENTRUM, UPC y Toulouse.
- `nv` — nivel o tipo nativo tal cual lo publica la institución (para el tooltip).
- `agg` — `true` si la fila es una categoría que agrupa varios programas y no un programa en sí. Viene directo del
  campo `es_categoria` de cada registro en `programas_*.json` (no de una lista por institución): tras la
  reverificación 2026-09-16 ronda 2, UPC Postgrado se desglosó de 45 categorías a 311 programas individuales y solo
  5 maestrías (Psicología, RRHH y Liderazgo, Dirección de la Comunicación Empresarial, Gestión y Desarrollo del
  Talento, Psicología de la Salud y Estilos de Vida) siguen sin página propia y quedan como categoría. Cada fila así
  lleva `*` en la tabla de tipos de curso IA. La prevalencia y el mapa rayan (o dejan hueco) la institución completa
  solo cuando **todas** sus filas son agregadas, lo que hoy no ocurre en ningún segmento: UPC ya es comparable
  (`no_comparable` está vacío) y entra al puesto de prevalencia, con el rayado limitado a esas 5 filas sueltas.
  Las 10 "áreas temáticas" de ESAN (p. ej. "Área de Marketing") no llevan `agg`: no son programas y se excluyen del
  todo del dataset vía `excluir_nv` en `build_segment.py`, así que no cuentan ni en el catálogo ni en ningún gráfico.

### Segundas especialidades (solo posgrado)

Las 10 segundas especialidades (UTP 8, UPC 2) salen del dataset vía `excluir_nv` en `build_segment.py`, igual que las
áreas temáticas de ESAN: ninguna tiene IA y por separado ninguna institución llegaba a 10 registros, así que solo
fragmentaban el filtro de nivel y los gráficos. Posgrado queda con tres niveles: Educación ejecutiva, Maestría y MBA,
Doctorado.

### Correcciones manuales a la marca de IA

`es_candidato_ia` del crawl es un candidato, no un veredicto. Regla aplicada al curar los grupos: se mantiene la marca
si el nombre o la sumilla presentan la IA como contenido del programa (herramienta, módulo o resultado de aprendizaje);
se quita si la IA solo aparece como adorno del copy de un curso de otro tema, o si la evidencia está copiada de otro
registro. Las correcciones viven en `SIN_IA` y `RENOMBRES` de `scripts/build_segment.py` y el script las imprime al
correr. Hoy son dos, las dos de Toulouse Lautrec:

| Curso | Cambio | Por qué |
|---|---|---|
| Curso de Diseño de Jardines y Paisajismo | se le quita la marca de IA | el único rastro de IA es la cola de la meta description ("proyectos sostenibles con IA") en un curso de paisajismo: no hay módulo, herramienta ni resultado de IA |
| `.../cursos/big-data-business-intelligence` | se renombra a "Curso de Big Data & Business Intelligence" y se le quita la marca | el crawl le copió nombre y sumilla al Curso de Data Science & Machine Learning (de ahí el duplicado); por el slug el programa es Big Data & BI y la evidencia de IA no es suya |

Toulouse pasa así de 10 candidatos a 8 cursos con IA (10.3% de su catálogo). Se revisaron los otros dos casos
dudosos y se mantuvieron: "Social Media Marketing" ("Domina Meta Ads, TikTok Ads, GA4 e IA generativa") y "Marketing
Digital desde Cero" ("social media, contenidos con IA y social ads") nombran la IA como contenido del curso, igual
que "Community & Social Media Manager" de Cibertec.

### Reverificación 2026-09-16

USIL IE (Institutos) se reverificó a fondo más allá del sitemap del crawl original: pasó de 11 a 17 programas y de
3 a 6 con IA (1 curso oculto por `noindex` y 5 brochures en `files.usil.edu.pe` sin página propia activa; ver la nota
"USIL IE" del panel "Qué no dice este dato" para el nivel de confianza de cada uno). En posgrado se reclasificaron
29 registros de CENTRUM que el crawl original contaba como "Educación ejecutiva" y en realidad son doctorado, MBA o
maestría, y se recapturó Pacífico Business School en su dominio correcto (`pbs.edu.pe`). El mercado de institutos
pasó de 501 a 507 programas (39 a 42 con IA); USIL EPG no cambió (10 de 74, 13.5%, sigue 1.ª del segmento).

### Reverificación 2026-09-16, ronda 2

TECSUP (Institutos) se recapturó desde su REST API pública (el HTML servía un placeholder Lorem Ipsum): pasó de 168 a
174 cursos y de 1 a 5 con IA. El mercado de institutos queda en 513 programas, 46 con IA. En posgrado, UPC se
desglosó de 45 categorías a 311 programas individuales (h1/URL/meta de cada página; 5 maestrías siguen sin página
propia y quedan como categoría, ver `agg` arriba) y las 10 "áreas temáticas" de ESAN salieron del dataset por
completo (no son programas). El mercado de posgrado queda en 710 programas, 59 con IA; USIL EPG no cambió (10 de 74,
13.5%, sigue 1.ª del segmento, ahora entre las 6 instituciones porque todas son comparables). `grupos_ia_institutos.json`
y `grupos_ia_posgrado.json` se re-curaron desde cero para los cursos IA nuevos de TECSUP y UPC, y las cifras citadas
en `acciones_institutos.js` / `acciones_posgrado.js` ya reflejan estos números.

### Reverificación 2026-09-16, ronda 3

Dos correcciones puntuales de marca IA, ambas documentadas curso por curso en `01_Logs/crawl_log.json` de cada
carpeta (`reverificacion_2026-09-16_ronda3`):

- **UPC Postgrado.** De las 5 categorías sin página propia (`es_categoria: true`, ver `agg` arriba), 2 (Dirección de
  la Comunicación Empresarial, Gestión y Desarrollo del Talento) tenían `es_candidato_ia: true` sacado de escanear el
  cuerpo completo de su página de categoría — una regla distinta a la del resto del dataset (h1/URL/meta de la
  página individual) — y además duplican temas ya desglosados en programas individuales. Se les puso
  `es_candidato_ia: false` en `Posgrado/00_Data/processed/programas_upc.json`, conservando `evidencia_ia` como
  referencia de por qué se habían marcado. UPC pasa de 32/311 (10.3%) a 30/311 (9.6%) con IA.
- **TECSUP.** Sus 5 candidatos IA (ronda 2) se habían marcado leyendo `content.rendered`/`excerpt` de la REST API
  (la descripción corta oficial), no h1/URL/meta description — TECSUP no publica meta description (sin Yoast). Se
  reverificó cada uno: solo 1 tiene "IA" en el h1 y la URL (Diseña tu StartUp con IA). De los otros 4, se aplicó el
  criterio "IA como contenido central del curso, no mención de paso": se mantuvo Desarrollo Web Java con Vibe
  Coding (la IA define la metodología del curso) y se quitaron Planner de Mantenimiento de Equipo Pesado, Gestión
  de Proyectos bajo PMBOK y Gestión y Análisis de Reportes con Power BI (la IA es una cláusula adicional en un
  temario de otro tema). TECSUP pasa de 5/174 a 2/174 con IA.

El mercado de institutos queda en 513 programas, 43 con IA (8.4%); USIL IE sin cambios (6 de 17, 35.3%, sigue 1.ª del
segmento). El mercado de posgrado queda en 710 programas, 57 con IA (8.0%); USIL EPG sin cambios (10 de 74, 13.5%,
sigue 1.ª entre comparables). `grupos_ia_institutos.json` y `grupos_ia_posgrado.json` se ajustaron quitando los ids
de los cursos retirados (y una referencia huérfana a un área de ESAN ya excluida en la ronda 2), sin bajar de 8
grupos en ningún segmento; `acciones_institutos.js` y `acciones_posgrado.js` reflejan las cifras nuevas. La acción de
posgrado sobre una maestría en Datos e IA ahora nombra que UPC ya vende, como programas individuales, una Maestría
en Inteligencia Artificial y una Maestría en Data Science, además de ESAN y UTP.

## Tipos de curso con IA (sección 5)

Grupos curados a mano leyendo el nombre y la sumilla de cada curso con IA:

| Segmento | Archivo | Formato | Cursos IA | Grupos |
|---|---|---|---|---|
| Educación continua | `scripts/grupos_ia.json` | `{groups:[{name, urls}]}` | 137 | 27 |
| Institutos | `scripts/grupos_ia_institutos.json` | `{groups:[{name, ids}]}` | 43 | 12 |
| Posgrado | `scripts/grupos_ia_posgrado.json` | `{groups:[{name, ids}]}` | 57 | 12 |

Los segmentos nuevos se agrupan por `id` y no por URL (ver arriba). `python scripts/build_segment.py --grupos` imprime
cada grupo con sus cursos para revisarlo, y el build avisa si algún curso con IA se quedó sin grupo.

## Parámetros de URL

`?seg=institutos` · `?seg=posgrado` · `?tipo=Curso%20corto` (las opciones cambian según el segmento) · `?linea=Salud`
(solo educación continua) · `?view=B` (mapa de ranking, solo educación continua) · `?static` (todo montado y sin
animaciones, para capturas o PDF).

## Deploy

`npx vercel --prod` desde esta carpeta (framework Vite detectado automáticamente), o importar el repo en vercel.com con
Root Directory = `app`.
