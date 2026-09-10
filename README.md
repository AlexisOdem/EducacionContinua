# Dashboard IA en educación continua (USIL vs mercado)

Vite + React + Tailwind v4 + Recharts + Motion. Sin backend: los datos viven en `src/data.json`.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/
```

Regenerar datos (lee `../00_Data/raw/programas_*.json`):

```bash
python scripts/build_data.py
```

Deploy en Vercel: `npx vercel --prod` desde esta carpeta (framework Vite detectado automáticamente), o importar el repo en vercel.com con Root Directory = `app`.

Parámetros de URL: `?tipo=Curso%20corto` o `?tipo=Especialización%20y%20diplomado`, `?view=B`, `?static` (todo montado y sin animaciones, para capturas o PDF).

Grupos de cursos IA similares: `scripts/grupos_ia.json` (nombre del grupo → URLs). Acciones: `src/acciones.js`.
