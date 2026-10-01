import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './': rutas relativas, funciona en alexisodem.github.io/EducacionContinua/ y en local sin cambiar nada.
// Dos páginas: el dashboard (index.html) y la propuesta para la EPG (alexis/index.html → /alexis/).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: { rollupOptions: { input: { main: 'index.html', alexis: 'alexis/index.html' } } },
})
