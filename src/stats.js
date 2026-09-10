import D from './data.json'

export const UNIS = D.unis, TIPOS = D.tipos, LINEAS = D.lineas, RANKING = D.ranking, FECHA = D.fecha, RANKING_FUENTE = D.ranking_fuente
export const ALL = D.rows
export const S = n => n == null ? 's/d' : 'S/ ' + Math.round(n).toLocaleString('en-US')
export const isUsil = u => u === 'USIL'

export const mean = xs => { xs = xs.filter(x => x != null); return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null }
export const median = xs => { xs = xs.filter(x => x != null).sort((a, b) => a - b); if (!xs.length) return null; const m = xs.length >> 1; return Math.round(xs.length % 2 ? xs[m] : (xs[m - 1] + xs[m]) / 2) }
const pct = (a, b) => b ? +(100 * a / b).toFixed(1) : null

export const filt = tipo => tipo === 'Todos' ? ALL : ALL.filter(r => r.t === tipo)

export function byUni(rows) {
  return UNIS.map(u => {
    const rs = rows.filter(r => r.u === u), ia = rs.filter(r => r.ia), no = rs.filter(r => !r.ia)
    return {
      u, total: rs.length, ia: ia.length, noia: no.length, pct: pct(ia.length, rs.length),
      avgIA: mean(ia.map(r => r.p)), medIA: median(ia.map(r => r.p)), nIA: ia.filter(r => r.p).length,
      avgNo: mean(no.map(r => r.p)), medNo: median(no.map(r => r.p)), nNo: no.filter(r => r.p).length,
      ph: mean(ia.map(r => r.ph)), nPh: ia.filter(r => r.ph).length, ranking: RANKING[u],
    }
  })
}

export function mercado(rows) {
  const ia = rows.filter(r => r.ia)
  return { total: rows.length, ia: ia.length, pct: pct(ia.length, rows.length), avgIA: mean(ia.map(r => r.p)), medIA: median(ia.map(r => r.p)) }
}

// % que sube el precio promedio cuando el curso incorpora IA (null si falta alguno de los dos lados)
export const premium = rows => {
  const ia = mean(rows.filter(r => r.ia).map(r => r.p)), no = mean(rows.filter(r => !r.ia).map(r => r.p))
  return ia && no ? Math.round(100 * (ia / no - 1)) : null
}
export const premiumByUni = tipo => byUniRows(filt(tipo)).map(({ u, rs }) => ({ u, prem: premium(rs), nIA: rs.filter(r => r.ia && r.p).length, nNo: rs.filter(r => !r.ia && r.p).length }))
export const premiumByLinea = (tipo, u = 'USIL') => LINEAS.map(l => {
  const rs = filt(tipo).filter(r => r.u === u && r.l === l)
  return { l, prem: premium(rs), nIA: rs.filter(r => r.ia && r.p).length, nNo: rs.filter(r => !r.ia && r.p).length }
}).filter(x => x.prem != null).sort((a, b) => b.prem - a.prem)
const byUniRows = rows => UNIS.map(u => ({ u, rs: rows.filter(r => r.u === u) }))

// prevalencia IA por tipo de curso, por universidad
export const prevTipo = tipo => UNIS.map(u => {
  const rs = ALL.filter(r => r.u === u && r.t === tipo), ia = rs.filter(r => r.ia).length
  return { u, total: rs.length, ia, noia: rs.length - ia, pct: pct(ia, rs.length) }
})
// cortos vs programas largos (especializaciones + diplomados)
export const cortosLargos = () => UNIS.map(u => {
  const c = ALL.filter(r => r.u === u && r.t === 'Curso corto'), l = ALL.filter(r => r.u === u && r.t !== 'Curso corto')
  return { u, x: pct(c.filter(r => r.ia).length, c.length), y: pct(l.filter(r => r.ia).length, l.length), nC: c.length, nL: l.length }
})

export function heat(rows) {
  return LINEAS.map(l => {
    const cells = {}
    UNIS.forEach(u => { const rs = rows.filter(r => r.u === u && r.l === l), ia = rs.filter(r => r.ia); cells[u] = { n: rs.length, ia: ia.length, p: mean(ia.map(r => r.p)) } })
    const ia = rows.filter(r => r.l === l && r.ia)
    return { l, cells, total: rows.filter(r => r.l === l).length, totalIA: ia.length, pMkt: mean(ia.map(r => r.p)) }
  }).sort((a, b) => b.totalIA - a.totalIA)
}

// cursos IA de competidores en temas o líneas donde USIL no tiene ningún curso IA
export function gaps(rows) {
  const usil = rows.filter(r => r.u === 'USIL' && r.ia)
  const temas = new Set(usil.map(r => r.tema)), lineas = new Set(usil.map(r => r.l))
  const list = rows.filter(r => r.ia && r.u !== 'USIL' && (!temas.has(r.tema) || !lineas.has(r.l))).map(r => ({ ...r, why: lineas.has(r.l) ? r.tema : r.l }))
  const groups = {}
  list.forEach(r => (groups[r.why] ||= []).push(r))
  return Object.entries(groups).map(([why, rs]) => ({ why, rs: rs.sort((a, b) => (a.p || 1e9) - (b.p || 1e9)) })).sort((a, b) => b.rs.length - a.rs.length)
}

// puntos para el jitter de precios
const hash = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return ((h >>> 0) % 1000) / 1000 }
export const pricePoints = rows => rows.filter(r => r.p).map(r => ({ x: UNIS.indexOf(r.u) + (hash(r.n) - 0.5) * 0.6, y: r.p, u: r.u, ia: r.ia, n: r.n, t: r.t }))
