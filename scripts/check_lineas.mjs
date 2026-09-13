/* Chequeo de la regla de arquetipo contra data.json: node scripts/check_lineas.mjs */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { arquetipo, metricasLinea } from '../src/lineas.js'

const D = createRequire(import.meta.url)('../src/data.json')

const ESPERADO = {
  'Hotelería, Gastronomía y Alimentos': 'nicho',
  'Salud': 'hueco',
  'Proyectos y Agilidad': 'hueco',
  'Gestión Pública': 'hueco',
  'Idiomas y Habilidades': 'hueco',
  'Gestión y Negocios': 'batalla',
  'Marketing y Ventas': 'batalla',
  'Datos y Analítica': 'batalla',
  'Tecnología y Software': 'batalla',
  'Comunicación y Diseño': 'batalla',
  'Educación': 'batalla',
  'IA transversal / Otros': 'batalla',
  'Talento y RRHH': 'muestra',
  'Derecho y Cumplimiento': 'muestra',
  'Finanzas y Contabilidad': 'muestra',
  'Operaciones y Logística': 'muestra',
  'Arquitectura, Construcción e Ingeniería': 'muestra',
}

assert.deepEqual([...D.lineas].sort(), Object.keys(ESPERADO).sort(), 'la lista de líneas de data.json cambió')

for (const l of D.lineas) {  // tipo = 'Todos'
  const m = metricasLinea(D.rows.filter(r => r.l === l), D.unis)
  const a = arquetipo(m)
  assert.equal(a, ESPERADO[l], `${l}: arquetipo ${a}, se esperaba ${ESPERADO[l]} (${JSON.stringify(m)})`)
  console.log(`ok  ${a.padEnd(8)} ${l}`)
}
console.log(`\n${D.lineas.length} líneas clasificadas como se esperaba.`)
