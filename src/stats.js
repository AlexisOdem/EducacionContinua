import D from './data.json'
import { arquetipo, metricasLinea } from './lineas'

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

// puntos para el jitter de precios (us = columnas del gráfico, por si se ocultan universidades sin precio)
const hash = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return ((h >>> 0) % 1000) / 1000 }
export const pricePoints = (rows, us = UNIS) => rows.filter(r => r.p && us.includes(r.u)).map(r => ({ x: us.indexOf(r.u) + (hash(r.n) - 0.5) * 0.6, y: r.p, u: r.u, ia: r.ia, n: r.n, t: r.t }))

/* Ficha de línea — todo lo que necesitan los 6 paneles, ya filtrado por línea. */
export const LINEA_GENERAL = 'General'
const ordCursos = (a, b) => (isUsil(b.u) - isUsil(a.u)) || (a.u > b.u) - (a.u < b.u) || (a.p ?? 1e9) - (b.p ?? 1e9)
const puesto = xs => { const i = xs.findIndex(x => isUsil(x.u)); return i < 0 ? null : i + 1 }
export const lista = xs => xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} ${/^h?i/i.test(xs.at(-1)) ? 'e' : 'y'} ${xs.at(-1)}`
const pl = (n, s) => `${n} ${s}${n === 1 ? '' : 's'}`

export function linea(rows, l) {
  const rs = rows.filter(r => r.l === l)
  const unis = byUni(rs), mkt = mercado(rs), usil = unis.find(u => isUsil(u.u))
  const vol = unis.filter(u => u.total).sort((a, b) => b.total - a.total)
  const pre = unis.filter(u => u.medIA != null).sort((a, b) => b.medIA - a.medIA)
  const pComp = rs.filter(r => !isUsil(r.u) && r.ia && r.p).map(r => r.p)
  const medComp = median(pComp)
  const conPrecio = UNIS.filter(u => rs.some(r => r.u === u && r.p))
  const m = metricasLinea(rs, UNIS)
  const o = {
    ...m, l, rs, unis, mkt, usil, gs: grupos(rs), arq: arquetipo(m),
    cuota: rs.length ? Math.round(100 * usil.total / rs.length) : 0,
    puestoVol: puesto(vol), k: vol.length, puestoPrecio: puesto(pre), kp: pre.length, lider: vol[0],
    medComp, minComp: pComp.length ? Math.min(...pComp) : null, maxComp: pComp.length ? Math.max(...pComp) : null,
    indice: usil.medIA != null && medComp ? Math.round(100 * usil.medIA / medComp) : null,
    puntos: pricePoints(rs, conPrecio), conPrecio, sinPrecio: UNIS.filter(u => rs.some(r => r.u === u) && !conPrecio.includes(u)),
    porTipo: UNIS.map(u => { const x = rs.filter(r => r.u === u); return { u, total: x.length, corto: x.filter(r => r.t === TIPOS[0]).length, largo: x.filter(r => r.t === TIPOS[1]).length } }),
    cursosIA: rs.filter(r => r.ia).sort(ordCursos),
    ladder: escalera(rs),
    unisIA: COMPS.filter(u => rs.some(r => r.u === u && r.ia)),
  }
  o.insights = insights(o)
  return o
}

/* Insights por reglas (3 frases). tono: usil = favorable, comp = neutral, gold = alerta. */
function insights(o) {
  const { usil, medComp, mktIA, usilIA, usilTot, total, indice } = o
  const lidera = !o.lider
    ? { t: 'Ninguna universidad tiene programas en la línea con este filtro.', c: 'comp' }
    : isUsil(o.lider.u)
      ? { t: `USIL lidera el volumen de la línea con ${pl(o.lider.total, 'programa')} (1° de ${o.k}).`, c: 'usil' }
      : { t: `${o.lider.u} lidera el volumen de la línea con ${pl(o.lider.total, 'programa')}; USIL ${o.puestoVol ? `es ${o.puestoVol}° de ${o.k}` : 'no tiene programas con este filtro'}.`, c: 'comp' }
  const precioVs = usil.medIA == null || medComp == null
    ? { t: 'Falta precio publicado en los cursos IA de un lado de la comparación.', c: 'comp' }
    : { t: `USIL vende el curso IA a ${S(usil.medIA)}, el ${indice}% de la mediana de los competidores (${S(medComp)}).`, c: indice < 50 ? 'gold' : indice > 150 ? 'usil' : 'comp' }

  if (o.arq === 'nicho') {
    const solo = usilIA > 0 && usilIA === mktIA
    return [
      { t: `USIL concentra ${o.cuota}% del catálogo de la línea (${usilTot} de ${total} programas).`, c: 'usil' },
      solo ? { t: `Los ${usilIA} cursos IA de la línea son de USIL: nicho sin competencia.`, c: 'usil' } : { t: `USIL tiene ${usilIA} cursos IA de ${mktIA} en la línea.`, c: 'comp' },
      { t: `Precio mediano USIL con IA ${S(usil.medIA)} frente a ${S(usil.medNo)} sin IA.`, c: 'comp' },
    ]
  }
  if (o.arq === 'hueco') {
    return [
      { t: `USIL tiene ${pl(usilTot, 'programa')} en la línea y ninguno con IA.`, c: 'gold' },
      { t: `${lista(o.unisIA)} ya ${o.unisIA.length > 1 ? 'venden' : 'vende'} ${pl(mktIA, 'curso')} IA.`, c: 'comp' },
      medComp == null ? { t: 'Los competidores no publican precio en esos cursos.', c: 'comp' }
        : { t: `Precio mediano de esos cursos: ${S(medComp)}${o.minComp === o.maxComp ? '' : ` (rango ${S(o.minComp)}–${S(o.maxComp)})`}.`, c: 'comp' },
    ]
  }
  if (o.arq === 'batalla') {
    const gaps = o.gs.filter(g => !g.nUsil && g.k >= 2).map(g => g.g)
    return [lidera, precioVs, { t: `Temáticas IA que venden 2+ competidores y USIL no: ${gaps.length ? lista(gaps) : 'ninguna'}.`, c: gaps.length ? 'gold' : 'usil' }]
  }
  const desglose = UNIS.map(u => ({ u, n: o.rs.filter(r => r.u === u && r.ia).length })).filter(x => x.n).map(x => `${x.u} ${x.n}`)
  const tercero = usilIA > 0 ? { t: `USIL ${S(usil.medIA)} frente a ${S(medComp)} de los competidores.`, c: indice != null && indice < 50 ? 'gold' : 'comp' }
    : mktIA === 0 ? { t: 'Ninguna universidad vende IA en esta línea todavía.', c: 'usil' }
      : { t: `USIL no tiene cursos IA en la línea; los competidores venden ${mktIA}.`, c: 'gold' }
  return [lidera, { t: mktIA ? `Solo ${pl(mktIA, 'curso')} IA en la línea: ${lista(desglose)}.` : 'La línea no tiene ningún curso con IA.', c: 'comp' }, tercero]
}
