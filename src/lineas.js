/* Arquetipo de una línea de carrera: decide qué enfatiza la ficha.
   Módulo puro, sin React ni data.json, para que lo usen igual la app y scripts/check_lineas.mjs. */
export const MAX_MUESTRA = 6  // 1 a 6 cursos IA en la línea = muestra pequeña (PLAN_LINEAS.md)

/* rs = filas de la línea con el filtro de tipo ya aplicado; us = lista de universidades. */
export function metricasLinea(rs, us) {
  const usil = rs.filter(r => r.u === 'USIL')
  return {
    total: rs.length,
    usilTot: usil.length,
    usilIA: usil.filter(r => r.ia).length,
    mktIA: rs.filter(r => r.ia).length,
    unisIAPrecio: us.filter(u => rs.some(r => r.u === u && r.ia && r.p)).length,
  }
}

export const arquetipo = ({ total, usilTot, usilIA, mktIA, unisIAPrecio }) =>
  usilTot / total > 0.6 ? 'nicho'
    : usilTot > 0 && usilIA === 0 && mktIA > 0 ? 'hueco'
      : unisIAPrecio >= 3 && mktIA > MAX_MUESTRA ? 'batalla'
        : 'muestra'
