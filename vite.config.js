import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './': rutas relativas, funciona en alexisodem.github.io/EducacionContinua/ y en local sin cambiar nada.
export default defineConfig({ base: './', plugins: [react(), tailwindcss()] })
