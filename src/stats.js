import D from './data.json'

export const UNIS = D.unis, TIPOS = D.tipos, LINEAS = D.lineas, RANKING = D.ranking, FECHA = D.fecha, RANKING_FUENTE = D.ranking_fuente
export const COMPS = UNIS.filter(u => u !== 'USIL')
export const ALL = D.rows
export const S = n => n == null ? 's/d' : 'S/ ' + Math.round(n).toLocaleString('en-US')
export const isUsil = u => u === 'USIL'

export const mean = xs => { xs = xs.filter(x => x != null); return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null }
export const median = xs => { xs = xs.filter(x => x != null).sort((a, b) => a - b); if (!xs.length) return null; const m = xs.length >> 1; return xs.length % 2 ? xs[m] : (xs[m - 1] + xs[m]) / 2 }
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

/* Premium IA: cada celda es línea de carrera × tipo (nunca se compara un corto con un programa largo).
   prima de la celda = mediana(precio con IA) / mediana(precio sin IA) − 1, solo si la celda tiene MIN_NO+ cursos sin IA.
   Barra de la línea = promedio de sus celdas comparables ponderado por nº de cursos IA.
   Cifra de la universidad = promedio de esas barras con el mismo peso; se publica con MIN_IA+ cursos IA comparados.
   Así universidad y línea cuentan la misma historia (sin efecto de mezcla ni de atípicos). */
export const MIN_NO = 5, MIN_IA = 5
const wavg = xs => { const w = xs.reduce((a, x) => a + x.w, 0); return w ? xs.reduce((a, x) => a + x.v * x.w, 0) / w : null }
function celdas(rows, u, l) {
  return TIPOS.map(t => {
    const rs = rows.filter(r => r.u === u && r.l === l && r.t === t)
    const ia = rs.filter(r => r.ia && r.p).map(r => r.p), no = rs.filter(r => !r.ia && r.p).map(r => r.p)
    return { ia, no, ok: ia.length > 0 && no.length >= MIN_NO, v: ia.length && no.length ? 100 * (median(ia) / median(no) - 1) : null }
  }).filter(c => c.ia.length)
}
export function premiumLineas(rows, u) {
  return LINEAS.map(l => {
    const cs = celdas(rows, u, l); if (!cs.length) return null
    const ok = cs.filter(c => c.ok), ref = cs.filter(c => c.v != null)
    return {
      l, ok: ok.length > 0,
      prem: ok.length ? Math.round(wavg(ok.map(c => ({ v: c.v, w: c.ia.length })))) : null,
      refPct: ref.length ? Math.round(wavg(ref.map(c => ({ v: c.v, w: c.ia.length })))) : null,  // referencial, sin umbral (no llamar 'ref': Recharts esparce el dato como props y React lo toma como ref)
      nIA: (ok.length ? ok : cs).reduce((a, c) => a + c.ia.length, 0), nNo: (ok.length ? ok : cs).reduce((a, c) => a + c.no.length, 0),
      pIA: median((ok.length ? ok : cs).flatMap(c => c.ia)), pNo: median((ok.length ? ok : cs).flatMap(c => c.no)),
    }
  }).filter(Boolean).sort((a, b) => (b.ok - a.ok) || (b.prem ?? -1e9) - (a.prem ?? -1e9))
}
export function premiumUni(rows, u) {
  const ls = premiumLineas(rows, u).filter(x => x.ok), nComp = ls.reduce((a, x) => a + x.nIA, 0)
  const nIA = rows.filter(r => r.u === u && r.ia && r.p).length, nNoTotal = rows.filter(r => r.u === u && !r.ia && r.p).length
  const why = !nNoTotal ? 'no publica precio en cursos sin IA' : nComp < MIN_IA ? `muestra insuficiente: ${nComp} de ${nIA} cursos IA con base comparable (se piden ${MIN_IA})` : null
  return { u, prem: why ? null : Math.round(wavg(ls.map(x => ({ v: x.prem, w: x.nIA })))), why, nComp, nIA, nLineas: ls.length }
}
export const premiumByUni = tipo => UNIS.map(u => premiumUni(filt(tipo), u))

/* 3b — escalera de precio por línea × tipo (medianas): USIL sin IA → USIL con IA → competidores con IA.
   Solo celdas donde USIL y al menos un competidor venden IA con precio. gap = USIL con IA frente a competidores con IA. */
export function escalera(rows) {
  const out = []
  LINEAS.forEach(l => TIPOS.forEach(t => {
    const rs = rows.filter(r => r.l === l && r.t === t && r.p)
    const uIA = rs.filter(r => isUsil(r.u) && r.ia).map(r => r.p), uNo = rs.filter(r => isUsil(r.u) && !r.ia).map(r => r.p)
    const cIA = rs.filter(r => !isUsil(r.u) && r.ia).map(r => r.p)
    if (!uIA.length || !cIA.length) return
    out.push({ l: t === TIPOS[0] ? l : `${l} · largo`, usilNo: uNo.length >= MIN_NO ? median(uNo) : null, usilIA: median(uIA), mkt: median(cIA),
      nNo: uNo.length, nU: uIA.length, nC: cIA.length, gap: Math.round(100 * (median(uIA) / median(cIA) - 1)) })
  }))
  return out.sort((a, b) => a.gap - b.gap)
}

export function heat(rows) {
  return LINEAS.map(l => {
    const cells = {}
    UNIS.forEach(u => { const rs = rows.filter(r => r.u === u && r.l === l), ia = rs.filter(r => r.ia); cells[u] = { n: rs.length, ia: ia.length, p: mean(ia.map(r => r.p)) } })
    const ia = rows.filter(r => r.l === l && r.ia)
    return { l, cells, total: rows.filter(r => r.l === l).length, totalIA: ia.length, pMkt: mean(ia.map(r => r.p)) }
  }).sort((a, b) => b.totalIA - a.totalIA)
}

/* Tipos de curso IA (grupos de cursos similares): cuántos competidores ofrecen cada tipo y si USIL lo tiene. */
export function grupos(rows) {
  const by = {}
  rows.filter(r => r.ia && r.g).forEach(r => (by[r.g] ||= []).push(r))
  return Object.entries(by).map(([g, rs]) => {
    const comp = rs.filter(r => !isUsil(r.u)), usil = rs.filter(r => isUsil(r.u))
    const comps = COMPS.filter(u => comp.some(r => r.u === u))
    return { g, rs: [...rs].sort((a, b) => (a.u > b.u) - (a.u < b.u) || (a.p || 1e9) - (b.p || 1e9)), comps, k: comps.length, pct: Math.round(100 * comps.length / COMPS.length), nComp: comp.length, nUsil: usil.length, pComp: median(comp.map(r => r.p)), pUsil: median(usil.map(r => r.p)) }
  }).sort((a, b) => b.k - a.k || b.nComp - a.nComp || (a.g > b.g) - (a.g < b.g))
}

/* 2 — cursos IA por formato (catálogo completo): cortos a la izquierda, especializaciones y diplomados a la derecha */
export const formatos = () => UNIS.map(u => {
  const c = ALL.filter(r => r.u === u && r.t === TIPOS[0]), l = ALL.filter(r => r.u === u && r.t === TIPOS[1])
  return { u, corto: c.filter(r => r.ia).length, largo: l.filter(r => r.ia).length, catCorto: c.length, catLargo: l.length }
}).sort((a, b) => b.corto - a.corto)

/* 2 — cuota de USIL por línea: % del catálogo de la línea frente a % de los cursos IA de la línea.
   alerta = USIL lidera el catálogo de la línea y su cuota en IA cae 10+ puntos. */
export function cuotaLineas(rows, minIA = 5) {
  const ia = rows.filter(r => r.ia)
  const tot = { cat: pct(rows.filter(r => isUsil(r.u)).length, rows.length), ia: pct(ia.filter(r => isUsil(r.u)).length, ia.length) }
  const ls = LINEAS.map(l => {
    const rs = rows.filter(r => r.l === l), rsIA = rs.filter(r => r.ia)
    const catU = rs.filter(r => isUsil(r.u)).length, iaU = rsIA.filter(r => isUsil(r.u)).length
    const lider = catU > 0 && COMPS.every(c => rs.filter(r => r.u === c).length <= catU)
    const cat = pct(catU, rs.length), sh = pct(iaU, rsIA.length)
    return { l, cat, ia: sh, nIA: rsIA.length, nCat: rs.length, catU, iaU, alerta: lider && sh - cat < -10 }
  }).filter(x => x.nIA >= minIA).sort((a, b) => (a.ia - a.cat) - (b.ia - b.cat))
  return { ls, tot }
}

// puntos para el jitter de precios
const hash = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return ((h >>> 0) % 1000) / 1000 }
export const pricePoints = rows => rows.filter(r => r.p).map(r => ({ x: UNIS.indexOf(r.u) + (hash(r.n) - 0.5) * 0.6, y: r.p, u: r.u, ia: r.ia, n: r.n, t: r.t }))
