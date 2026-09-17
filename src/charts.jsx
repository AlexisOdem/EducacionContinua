import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ResponsiveContainer, ScatterChart, Scatter, ZAxis, ReferenceArea, ReferenceLine, Label } from 'recharts'
import { UNIS, COMPS, S, isUsil } from './stats'

export const ANIM = typeof location === 'undefined' || !location.search.includes('static')
export const C = { usil: '#1D5FA8', usilT: '#B9CFEA', comp: '#66717F', compT: '#CFD5DC', ink: '#16202B', ink2: '#4B5866', muted: '#7C8894', line: '#E1E6EC', accent: '#7A5200', accentSoft: '#FFF3C4', gold: '#FFC72C' }
export const col = (u, tint) => isUsil(u) ? (tint ? C.usilT : C.usil) : (tint ? C.compT : C.comp)
const tickU = ({ x, y, payload }) => <text x={x} y={y} dy={4} textAnchor="end" fontSize={12} fontWeight={500} fill={isUsil(payload.value) ? C.usil : C.ink2}>{payload.value}</text>
const tickUb = ({ x, y, payload }) => <text x={x} y={y} dy={14} textAnchor="middle" fontSize={12} fontWeight={500} fill={isUsil(payload.value) ? C.usil : C.ink2}>{payload.value}</text>
const grid = <CartesianGrid stroke={C.line} horizontal={false} />
const tip = { contentStyle: { background: C.ink, border: 0, borderRadius: 6, color: '#fff', fontSize: 12 }, itemStyle: { color: '#fff' }, labelStyle: { color: '#fff', fontWeight: 600 }, cursor: { fill: 'rgba(22,32,43,.04)' } }

/* Aparece al hacer scroll; el gráfico se monta recién ahí para que anime. */
export function Reveal({ children, className = '', delay = 0, minH = 300 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.3 }) || !ANIM  // ?static: todo montado y sin animación (capturas, PDF)
  const reduce = useReducedMotion()
  return (
    <motion.div ref={ref} className={`min-w-0 ${className}`} initial={reduce || !ANIM ? false : { opacity: 0, y: 36 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}>
      {inView ? children : <div style={{ minHeight: minH }} />}
    </motion.div>
  )
}

/* Cifra que cuenta desde 0 al entrar en pantalla (y vuelve a contar si cambia el filtro). */
export function Counter({ value, format = v => Math.round(v), duration = 1.2 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!inView && ANIM) return
    if (reduce || !ANIM || value == null) { setV(value ?? 0); return }
    let t0, raf
    const tick = now => { t0 ??= now; const t = Math.min(1, (now - t0) / (duration * 1000)); setV(value * (1 - Math.pow(1 - t, 3))); if (t < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, reduce, duration])
  return <span ref={ref}>{value == null ? 's/d' : format(v)}</span>
}

export function Segmented({ value, onChange, options, small }) {
  return (
    <div className={`inline-flex rounded-md border border-line bg-white overflow-hidden ${small ? 'text-xs' : 'text-[13px]'}`}>
      {options.map(o => <button key={o} onClick={() => onChange(o)} className={`px-3 py-1.5 min-h-9 cursor-pointer transition-colors duration-150 ${value === o ? 'bg-usil-deep text-white' : 'text-ink2 hover:bg-usil-wash'}`} aria-pressed={value === o}>{o}</button>)}
    </div>
  )
}

export const Legend = ({ items }) => (
  <div className="flex flex-wrap gap-4 text-[12.5px] text-ink2 mb-2">
    {items.map(([c, t, dash]) => <span key={t} className="flex items-center gap-1.5">{dash ? <i className="inline-block w-4 border-t-2 border-dashed border-ink" /> : <i className="inline-block w-3 h-3 rounded-[3px]" style={{ background: c, border: c === C.accentSoft ? `1px solid ${C.gold}` : c === 'hatch' ? `1px dashed ${C.muted}` : 0, ...(c === 'hatch' ? { background: 'repeating-linear-gradient(45deg,#fff 0 3px,#CFD5DC 3px 5px)' } : {}) }} />}{t}</span>)}
  </div>
)

/* 1a — prevalencia apilada. Si TODAS las filas de una institución son categorías (agg=true), su barra va rayada;
   hoy ninguna institución de ningún segmento llega a ese 100% (UPC posgrado solo tiene 5 de 311 filas agregadas). */
const AggPat = () => <defs>
  <pattern id="aggU" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill={C.usil} /><rect width="2" height="6" fill="#fff" fillOpacity="0.55" /></pattern>
  <pattern id="aggC" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill={C.comp} /><rect width="2" height="6" fill="#fff" fillOpacity="0.55" /></pattern>
</defs>
const fillIA = x => x.agg ? `url(#${isUsil(x.u) ? 'aggU' : 'aggC'})` : col(x.u)

export function Prevalence({ data, h = 300, nota = '' }) {
  const d = [...data].filter(x => x.total).sort((a, b) => b.ia - a.ia)
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={d} layout="vertical" margin={{ left: 0, right: 90, top: 4, bottom: 4 }} barCategoryGap={10}>
        <AggPat />
        {grid}
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="u" width={80} tickLine={false} axisLine={false} tick={tickU} />
        <Tooltip {...tip} formatter={(v, k) => [v, k === 'ia' ? 'Con IA' : 'Sin IA']} />
        <Bar isAnimationActive={ANIM} dataKey="ia" stackId="a" name="ia" barSize={22}>{d.map(x => <Cell key={x.u} fill={fillIA(x)} />)}</Bar>
        <Bar isAnimationActive={ANIM} dataKey="noia" stackId="a" name="noia" barSize={22} radius={[0, 3, 3, 0]}>
          {d.map(x => <Cell key={x.u} fill={col(x.u, true)} />)}
          <LabelList dataKey="pct" content={({ x, y, width, height, index }) => {
            const r = d[index]; if (!r || r.pct == null) return null
            return <text x={x + width + 6} y={y + height / 2 + 4} fontSize={12} fontWeight={500} fill={C.ink2}>{r.pct}%{r.agg ? ` ${nota || 'cat.'}` : ' con IA'}</text>
          }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/* 1b (segmentos) — catálogo por nivel: una serie por tipo, degradado del color de la institución.
   pct = barras al 100% (se usa para el nivel de los cursos IA en la sección 3). */
const RAMP_U = ['#1D5FA8', '#4C85C2', '#87ADD9', '#B9CFEA', '#D3E1F1']
const RAMP_C = ['#66717F', '#8B939D', '#AEB5BD', '#CBD2D9', '#DCE1E6']
export const rampa = (u, i) => (isUsil(u) ? RAMP_U : RAMP_C)[i % 5]

/* El total va en el tick del eje, no al final de la barra: una barra apilada cuyo último tramo vale 0
   no dibuja etiqueta, y con 4 o 5 niveles eso deja filas sin cifra. */
const tickTotal = totales => ({ x, y, payload }) => (
  <text x={x} y={y} dy={4} textAnchor="end" fontSize={12} fill={isUsil(payload.value) ? C.usil : C.ink2}>
    <tspan fontWeight={500}>{payload.value}</tspan>
    {totales && <tspan fill={C.muted} dx={6}>{totales[payload.value]}</tspan>}
  </text>
)

export function StackedNivel({ data, tipos, h = 300, pct = false, vacio = 'Sin datos con este filtro' }) {
  const d = data.filter(x => x.total)
  if (!d.length) return <div className="flex items-center justify-center text-muted text-sm" style={{ height: h }}>{vacio}</div>
  const usa = tipos.filter(t => d.some(x => x[t]))
  const totales = pct ? null : Object.fromEntries(d.map(x => [x.u, x.total]))
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={d} layout="vertical" stackOffset={pct ? 'expand' : 'none'} margin={{ left: 0, right: 16, top: 4, bottom: 4 }} barCategoryGap={10}>
        {grid}
        <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={pct ? v => `${Math.round(v * 100)}%` : undefined} domain={pct ? [0, 1] : undefined} />
        <YAxis type="category" dataKey="u" width={pct ? 88 : 122} tickLine={false} axisLine={false} tick={tickTotal(totales)} />
        <Tooltip {...tip} formatter={(v, k) => [v, k]} />
        {usa.map((t, i) => (
          <Bar key={t} isAnimationActive={ANIM} dataKey={t} stackId="a" name={t} barSize={22} radius={i === usa.length - 1 ? [0, 3, 3, 0] : 0}>
            {d.map(x => <Cell key={x.u} fill={rampa(x.u, tipos.indexOf(t))} />)}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

/* Ficha 2 — mismo apilado que Prevalence pero por tipo: curso corto (pleno) y especialización y diplomado (tinte) */
export function StackedTipo({ data, h = 300 }) {
  const d = [...data].filter(x => x.total).sort((a, b) => b.total - a.total)
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={d} layout="vertical" margin={{ left: 0, right: 60, top: 4, bottom: 4 }} barCategoryGap={10}>
        {grid}
        <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="u" width={80} tickLine={false} axisLine={false} tick={tickU} />
        <Tooltip {...tip} formatter={(v, k) => [v, k === 'corto' ? 'Curso corto' : 'Especialización y diplomado']} />
        <Bar isAnimationActive={ANIM} dataKey="corto" stackId="a" name="corto" barSize={22}>{d.map(x => <Cell key={x.u} fill={col(x.u)} />)}</Bar>
        <Bar isAnimationActive={ANIM} dataKey="largo" stackId="a" name="largo" barSize={22} radius={[0, 3, 3, 0]}>
          {d.map(x => <Cell key={x.u} fill={col(x.u, true)} />)}
          <LabelList dataKey="total" position="right" style={{ fill: C.ink2, fontSize: 12, fontWeight: 500 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/* 1b — precio por hora */
export function PerHour({ data, h = 300 }) {
  const d = data.filter(x => x.ph).sort((a, b) => a.ph - b.ph)
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={d} layout="vertical" margin={{ left: 0, right: 110, top: 4, bottom: 4 }} barCategoryGap={10}>
        {grid}
        <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={v => `S/ ${v}`} />
        <YAxis type="category" dataKey="u" width={80} tickLine={false} axisLine={false} tick={tickU} />
        <Tooltip {...tip} formatter={(v, _, p) => [`S/ ${v} por hora · n=${p.payload.nPh}`, 'Cursos con IA']} />
        <Bar isAnimationActive={ANIM} dataKey="ph" barSize={22} radius={[0, 3, 3, 0]}>
          {d.map(x => <Cell key={x.u} fill={col(x.u)} />)}
          <LabelList dataKey="ph" position="right" formatter={v => `S/ ${v}/h`} style={{ fill: C.ink2, fontSize: 12, fontWeight: 500 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/* 1c — distribución de precios: cada punto es un programa. HTML con posiciones en % (antes ~700 símbolos de Recharts, lo más pesado de la página). */
const JDOM = [80, 20000], JTICKS = [100, 200, 500, 1000, 2000, 5000, 10000]
const jy = v => Math.min(100, Math.max(0, 100 - 100 * (Math.log(v) - Math.log(JDOM[0])) / (Math.log(JDOM[1]) - Math.log(JDOM[0]))))
export function Jitter({ points, unis, us = UNIS, h = 380 }) {
  const n = us.length, xp = x => 100 * (x + 0.5) / n
  const med = us.map((u, i) => { const x = unis.find(k => k.u === u); return { u, i, ia: x?.medIA, no: x?.medNo } })
  const bar = (m, v, tint) => v != null && <i key={m.u + (tint ? 'n' : 'i')} title={`${m.u} · mediana ${tint ? 'sin' : 'con'} IA ${S(v)}`} className="absolute h-[3px] -translate-y-1/2 z-[3] rounded-full" style={{ left: `${xp(m.i - 0.36)}%`, width: `${72 / n}%`, top: `${jy(v)}%`, background: col(m.u, tint) }} />
  return (
    <div className="grid grid-cols-[76px_minmax(0,1fr)] text-[12px] pt-2">
      <div className="relative" style={{ height: h }}>{JTICKS.map(v => <span key={v} className="absolute right-3 -translate-y-1/2 text-ink2 whitespace-nowrap tabular-nums" style={{ top: `${jy(v)}%` }}>{S(v)}</span>)}</div>
      <div className="min-w-0">
        <div className="relative" style={{ height: h }}>
          {JTICKS.map(v => <i key={v} className="absolute left-0 right-0 h-px bg-line" style={{ top: `${jy(v)}%` }} />)}
          {points.map((p, k) => <span key={k} title={`${p.u} · ${p.ia ? 'con IA' : 'sin IA'} · ${S(p.y)} · ${p.n}`} className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${xp(p.x)}%`, top: `${jy(p.y)}%`, background: col(p.u, !p.ia), opacity: p.ia ? 0.95 : 0.6, zIndex: p.ia ? 2 : 1, boxShadow: p.ia ? '0 0 0 1px #fff' : 'none' }} />)}
          {med.flatMap(m => [bar(m, m.no, true), bar(m, m.ia, false)])}
        </div>
        <div className="grid mt-2" style={{ gridTemplateColumns: `repeat(${n}, minmax(0,1fr))` }}>{us.map(u => <span key={u} className={`text-center font-medium ${isUsil(u) ? 'text-usil' : 'text-ink2'}`}>{u}</span>)}</div>
      </div>
    </div>
  )
}

/* 2a — mapa competitivo con cuadrante ideal (A: prevalencia × precio, B: ranking × prevalencia) */
/* Punto del mapa. USIL lleva un anillo SVG que se expande y desvanece 3 veces (no usa CSS transform: en SVG pisaría el translate de Recharts). */
const MapDot = ({ cx, cy, width, payload, ping }) => {
  const r = width / 2, us = isUsil(payload.u), hueco = payload.d?.agg  // hueco = sus filas son categorías, no programas
  return (
    <g>
      {us && ping && <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.usil} strokeWidth={2}>
        <animate attributeName="r" from={r} to={r + 20} dur="1.6s" begin="0.6s" repeatCount="3" fill="freeze" />
        <animate attributeName="opacity" from="0.9" to="0" dur="1.6s" begin="0.6s" repeatCount="3" fill="freeze" />
      </circle>}
      <circle cx={cx} cy={cy} r={r} fill={hueco ? '#fff' : (us ? C.usil : C.comp)} stroke={hueco ? (us ? C.usil : C.comp) : '#fff'} strokeWidth={hueco ? 2.5 : 2} strokeDasharray={hueco ? '4 3' : undefined} />
    </g>
  )
}

/* A: prevalencia × precio · B: ranking QS × prevalencia (solo educación continua)
   C: tamaño de catálogo (log) × prevalencia, cuadrante ideal = más IA que el mercado con catálogo sobre la mediana */
export function Mapa({ view, unis, mkt, medCat, h = 440 }) {
  const A = view === 'A', Cv = view === 'C'
  const ping = ANIM && !useReducedMotion()
  const pts = Cv ? unis.filter(u => u.total && u.pct != null).map(u => ({ u: u.u, x: u.total, y: u.pct, z: Math.max(1, u.ia), d: u }))
    : A ? unis.filter(u => u.avgIA && u.pct != null).map(u => ({ u: u.u, x: u.pct, y: u.avgIA, z: u.total, d: u }))
      : unis.filter(u => u.ranking && u.pct != null).map(u => ({ u: u.u, x: u.ranking, y: u.pct, z: u.total, d: u }))
  const qx = Cv ? medCat : A ? mkt.pct : 107, yq = A ? mkt.medIA : mkt.pct
  const my = Math.max(0, ...pts.map(p => p.y)), mx = Math.max(0, ...pts.map(p => p.x))
  const xMax = Cv ? Math.ceil(mx * 1.5 / 50) * 50 : A ? Math.max(40, Math.ceil((mx + 4) / 10) * 10) : 420
  const yMax = A ? Math.max(12000, Math.ceil(my * 1.4 / 1000) * 1000) : Math.max(40, Math.ceil((my + 4) / 10) * 10)
  const POS = Cv ? {} : A ? { USIL: 'left' } : { USIL: 'left', ULima: 'left' }
  const xTicks = Cv ? [10, 20, 50, 100, 200, 500].filter(v => v <= xMax) : undefined
  // radio real de la burbuja (ZAxis mapea z a área): en la vista C z = cursos IA y la etiqueta se pisaba con el círculo
  const zs = pts.map(p => p.z), zmin = Math.min(...zs), zmax = Math.max(...zs)
  const radio = z => Math.sqrt((180 + (zmax > zmin ? (z - zmin) / (zmax - zmin) : 1) * 920) / Math.PI)
  // anti-colisión de etiquetas: si dos quedan a <14px en vertical y se solapan en horizontal, la segunda
  // pasa al lado contrario de su burbuja (o, si tampoco alcanza, baja 14px). También evita pisar el texto
  // de las líneas de referencia (mediana/mercado, sembradas en `placed` antes de ubicar las burbujas) y,
  // solo en la vista C, el círculo de otra burbuja ya ubicada (`circles`): ahí `radio(z)` reproduce el
  // área real que ZAxis le da a cada burbuja (mismo rango [180,1100]), así que la caja de colisión es
  // exacta. En A/B el radio de burbuja es una aproximación para el offset de la etiqueta (ZAxis con área
  // fija [300,1600] sin fórmula inversa simple) y no alcanza para comparar contra el círculo real sin
  // falsos positivos, así que ahí la colisión sigue siendo solo etiqueta contra etiqueta, como antes.
  const placed = [], circles = []
  const boxOf = (lx, w, left) => left ? [lx - w, lx] : [lx, lx + w]
  const PAD = 6  // colchón horizontal: dos cajas a menos de esto se ven pegadas aunque no se solapen en rigor
  const solapan = (lx, ly, w, left) => {
    const [a0, a1] = boxOf(lx, w, left)
    if (placed.some(q => Math.abs(ly - q.ly) < 14 && a0 - PAD < q.x1 && a1 + PAD > q.x0)) return true
    if (!Cv) return false
    // caja de texto (alto ~14px sobre la línea base ly) contra el círculo de una burbuja ya colocada
    return circles.some(c => {
      const cx = Math.max(a0, Math.min(c.cx, a1)), cy = Math.max(ly - 12, Math.min(c.cy, ly + 2))
      return (c.cx - cx) ** 2 + (c.cy - cy) ** 2 < c.r ** 2
    })
  }
  // etiqueta de una ReferenceLine: se renderiza después del Scatter (más abajo en el JSX que sigue, aunque
  // recharts la pinta encima) para que `circles` ya tenga las burbujas y la etiqueta se corra si caería
  // encima de una (primero sube, si tampoco alcanza baja). Label con `content` reenvía x/y ya calculados
  // según `position` pero no el textAnchor (por diseño de Recharts, ver Label.js), así que el ancla se
  // decide aquí a partir de la misma `position`.
  const refLabel = (text, anchor, baseDy = 0) => ({ x, y }) => {
    const w = text.length * 5.6 + 6, left = anchor === 'end'
    const [a0, a1] = left ? [x - w, x] : [x, x + w]
    const hits = ly => Cv && circles.some(c => {
      const cx = Math.max(a0, Math.min(c.cx, a1)), cy = Math.max(ly - 12, Math.min(c.cy, ly + 2))
      return (c.cx - cx) ** 2 + (c.cy - cy) ** 2 < c.r ** 2
    })
    // solo sube (nunca baja): 'insideBottomLeft' ya está pegada al eje x y bajarla pisaría sus ticks.
    // baseDy: offset fijo antes de probar colisión (vista B: el rango de ranking pone institutos como PUCP
    // casi pegados al borde derecho, a la misma altura que "Mercado X%"; a diferencia de la vista C, aquí no
    // hay `circles` todavía cuando esto se evalúa -el Scatter se pinta después-, así que no se puede detectar
    // la colisión en pixeles y se sube un offset fijo en vez de depender de `hits`).
    let ly = y + baseDy
    for (const dy of [0, -16, -28, -40]) { const t = y + baseDy + dy; if (!hits(t)) { ly = t; break } }
    placed.push({ x0: a0, x1: a1, ly })
    return <text x={x} y={ly} textAnchor={anchor} fontSize={11} fill={C.muted}>{text}</text>
  }
  const refLines = (
    <>
      <ReferenceLine x={qx} stroke={C.muted} strokeDasharray="4 4">
        <Label position="insideBottomLeft" content={refLabel(Cv ? `Mediana ${Math.round(qx)}` : A ? `Mercado ${qx}%` : 'Mediana #107', 'start')} />
      </ReferenceLine>
      <ReferenceLine y={yq} stroke={C.muted} strokeDasharray="4 4">
        {/* Vista B: PUCP (rank casi al borde derecho del eje) cae casi a la misma altura que "Mercado X%" y su
            burbuja tapaba parte del rótulo; se sube 18px encima de la línea (baseDy) en vez de centrarlo sobre
            ella. Vista C no lo necesita: ya tiene su propio anti-colisión contra burbujas, ver `hits`. */}
        <Label position={A ? 'insideLeft' : 'insideRight'} content={refLabel(A ? `Mediana ${S(yq)}` : `Mercado ${yq}%`, A ? 'start' : 'end', !A && !Cv ? -18 : 0)} />
      </ReferenceLine>
    </>
  )
  const scatter = (
    <Scatter isAnimationActive={ANIM} data={pts} shape={props => <MapDot {...props} ping={ping} />}>
      <LabelList dataKey="u" content={({ x, y, value, index }) => {
        const p = pts[index]; if (!p) return null
        let left = POS[p.u] === 'left'
        const r = Cv ? radio(p.z) + 3 : 8 + Math.sqrt(p.z) * 1.2
        const w = value.length * 6.6 + 4  // ancho aproximado del texto a 13px/600
        let lx = x + (left ? -r - 4 : r + 4), ly = y + 4
        if (solapan(lx, ly, w, left)) {
          left = !left; lx = x + (left ? -r - 4 : r + 4)          // 1° intento: al lado contrario de la burbuja
          if (solapan(lx, ly, w, left)) ly += 14                  // 2° intento: la baja una línea
        }
        placed.push({ x0: boxOf(lx, w, left)[0], x1: boxOf(lx, w, left)[1], ly })
        circles.push({ cx: x, cy: y, r })
        return <text x={lx} y={ly} textAnchor={left ? 'end' : 'start'} fontSize={13} fontWeight={600} fill={isUsil(p.u) ? C.usil : C.ink2}>{value}</text>
      }} />
    </Scatter>
  )
  return (
    <ResponsiveContainer width="100%" height={h}>
      <ScatterChart margin={{ left: 0, right: 60, top: 10, bottom: 10 }}>
        <CartesianGrid stroke={C.line} />
        <XAxis type="number" dataKey="x" scale={Cv ? 'log' : 'auto'} domain={Cv ? [8, xMax] : A ? [0, xMax] : [10, xMax]} ticks={xTicks} reversed={view === 'B'} tickLine={false} axisLine={false} tickFormatter={v => Cv ? v : A ? `${v}%` : `#${v}`} />
        <YAxis type="number" dataKey="y" scale={A ? 'log' : 'auto'} domain={A ? [100, yMax] : [0, yMax]} ticks={A ? [100, 200, 500, 1000, 2000, 5000, 10000] : undefined} tickFormatter={v => A ? S(v) : `${v}%`} width={A ? 84 : 56} tickLine={false} axisLine={false} />
        <ZAxis type="number" dataKey="z" range={Cv ? [180, 1100] : [300, 1600]} />
        <ReferenceArea x1={Cv ? qx : A ? qx : 10} x2={Cv ? xMax : A ? xMax : qx} y1={yq} y2={yMax} fill={C.accentSoft} fillOpacity={0.9} stroke="none" label={{ value: 'CUADRANTE IDEAL', position: A ? 'insideBottomRight' : 'insideTopRight', fill: C.accent, fontSize: 12, fontWeight: 600 }} />
        <Tooltip {...tip} cursor={false} content={({ payload }) => payload?.length ? <div style={tip.contentStyle} className="px-3 py-2">{(() => { const d = payload[0].payload.d; return <><div className="font-semibold">{d.u}</div><div>{d.pct}% con IA ({d.ia} de {d.total})</div>{Cv ? (d.agg ? <div>filas por categoría, no por programa</div> : null) : <><div>Precio promedio IA {S(d.avgIA)}</div><div>Ranking QS: {d.ranking ? '#' + d.ranking : 's/d'}</div></>}</> })()}</div> : null} />
        {/* Orden condicional: en C, el Scatter va antes para que `circles` ya tenga las burbujas cuando
            `refLabel` decide si corre su etiqueta (caso "Mediana" pisando una burbuja). En A/B, la
            ReferenceLine va antes para que su caja quede en `placed` antes de ubicar las burbujas (caso
            "PUCP" pisando el rótulo "Mercado X%"). Recharts pinta según este orden, así que en ambos
            casos el elemento que sembró el dato de colisión también queda debajo en el z-order. */}
        {Cv ? <>{scatter}{refLines}</> : <>{refLines}{scatter}</>}
      </ScatterChart>
    </ResponsiveContainer>
  )
}

/* 3 — % que sube el precio con IA, escala divergente normalizada ±100 (la etiqueta muestra el valor real) */
const clamp = v => Math.max(-100, Math.min(100, v))
const fmtP = v => `${v > 0 ? '+' : ''}${v}%`
const endLabel = d => ({ x, y, width, height, index }) => {
  const r = d[index]; if (!r || r.prem == null) return null
  const a = x + Math.min(0, width), b = x + Math.max(0, width)
  return <text x={r.prem >= 0 ? b + 6 : a - 6} y={y + height / 2 + 4} textAnchor={r.prem >= 0 ? 'start' : 'end'} fontSize={12} fontWeight={600} fill={C.ink2}>{r.lbl}</text>
}
const Hatch = () => <defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#fff" /><rect width="2" height="6" fill={C.compT} /></pattern></defs>
const divAxis = <XAxis type="number" domain={[-100, 100]} ticks={[-100, -50, 0, 50, 100]} tickFormatter={v => fmtP(v)} tickLine={false} axisLine={false} allowDataOverflow />

const naLabel = { fill: C.muted, fontSize: 11 }

export function Premium({ data, h = 300 }) {
  const d = data.map(x => ({ ...x, v: x.prem == null ? null : clamp(x.prem), na: x.prem == null ? [-100, 100] : null, lbl: x.prem == null ? '' : fmtP(x.prem),
    nalbl: x.prem != null ? '' : x.why?.startsWith('muestra') ? 'muestra insuficiente' : 'sin precio en cursos sin IA' }))
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={d} layout="vertical" margin={{ left: 0, right: 56, top: 4, bottom: 4 }} barCategoryGap={10}>
        <Hatch />
        {grid}
        {divAxis}
        <YAxis type="category" dataKey="u" width={80} tickLine={false} axisLine={false} tick={tickU} />
        <Tooltip {...tip} formatter={(_, k, p) => k === 'na' ? [p.payload.why, p.payload.u] : [`${p.payload.lbl} · ${p.payload.nComp} de ${p.payload.nIA} cursos IA comparados en ${p.payload.nLineas} líneas`, p.payload.u]} />
        <Bar isAnimationActive={false} dataKey="na" barSize={20} fill="url(#hatch)"><LabelList dataKey="nalbl" position="insideLeft" style={naLabel} /></Bar>
        <Bar isAnimationActive={ANIM} dataKey="v" barSize={20} radius={3} minPointSize={2}>
          {d.map(x => <Cell key={x.u} fill={(x.prem ?? 0) >= 0 ? col(x.u) : col(x.u, true)} />)}
          <LabelList dataKey="v" content={endLabel(d)} />
        </Bar>
        <ReferenceLine x={0} stroke={C.ink} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* 3b — escalera de precio por línea: USIL sin IA (tinte) → USIL con IA (azul) → competidores con IA (gris). Escala log. */
const LOG = [100, 20000], lx = v => 100 * (Math.log(v) - Math.log(LOG[0])) / (Math.log(LOG[1]) - Math.log(LOG[0]))
export function PriceLadder({ data }) {
  if (!data.length) return <div className="h-[280px] flex items-center justify-center text-muted text-sm">USIL no comparte líneas con IA y precio con competidores en este filtro</div>
  const dot = (v, bg, border, t) => v != null && <span title={t} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full" style={{ left: `${lx(v)}%`, background: bg, border: border ? `2px solid ${border}` : 0 }} />
  return (
    <div className="text-[12px]">
      {data.map(x => {
        const vs = [x.usilNo, x.usilIA, x.mkt].filter(v => v != null), a = lx(Math.min(...vs)), b = lx(Math.max(...vs))
        return (
          <div key={x.l} className="grid grid-cols-[190px_minmax(0,1fr)_52px] gap-3 items-center h-[30px]" title={`${x.l} · USIL sin IA ${x.usilNo != null ? S(x.usilNo) + ` (${x.nNo})` : 'base < 5'} · USIL con IA ${S(x.usilIA)} (${x.nU}) · competidores con IA ${S(x.mkt)} (${x.nC})`}>
            <span className="text-right text-ink2 truncate">{x.l}</span>
            <span className="relative h-full">
              {[100, 500, 1000, 5000, 10000].map(v => <i key={v} className="absolute top-0 bottom-0 w-px bg-line" style={{ left: `${lx(v)}%` }} />)}
              <i className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full" style={{ left: `${a}%`, width: `${b - a}%`, background: x.gap <= -50 ? C.gold : C.compT }} />
              {dot(x.usilNo, '#fff', C.usilT, `USIL sin IA ${S(x.usilNo)}`)}
              {dot(x.mkt, C.comp, null, `Competidores con IA ${S(x.mkt)}`)}
              {dot(x.usilIA, C.usil, null, `USIL con IA ${S(x.usilIA)}`)}
            </span>
            <span className={`text-right font-semibold tabular-nums ${x.gap <= -50 ? 'text-accent' : 'text-ink2'}`}>{x.gap > 0 ? '+' : ''}{x.gap}%</span>
          </div>
        )
      })}
      <div className="grid grid-cols-[190px_minmax(0,1fr)_52px] gap-3 mt-1 text-muted">
        <span />
        <span className="relative h-4">{[100, 500, 1000, 5000, 10000].map(v => <span key={v} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${lx(v)}%` }}>{v >= 1000 ? `S/ ${v / 1000}k` : S(v)}</span>)}</span>
        <span />
      </div>
    </div>
  )
}

/* Ficha 3 (muestra pequeña) — un punto por curso IA con precio, misma escala log que la escalera */
const LTICKS = [100, 500, 1000, 5000, 10000]
export function PriceDots({ rows }) {
  if (!rows.length) return <div className="h-[200px] flex items-center justify-center text-muted text-sm">Ningún curso IA con precio publicado en esta línea</div>
  return (
    <div className="text-[12px]">
      {rows.map(r => (
        <div key={r.url} className="grid grid-cols-[76px_minmax(0,1fr)_minmax(0,1.6fr)_64px] gap-3 items-center h-[30px]" title={`${r.u} · ${r.n} · ${r.t} · ${S(r.p)}`}>
          <span className={`truncate font-medium ${isUsil(r.u) ? 'text-usil' : 'text-ink2'}`}>{r.u}</span>
          <span className="truncate text-ink2">{r.n}</span>
          <span className="relative h-full">
            {LTICKS.map(v => <i key={v} className="absolute top-0 bottom-0 w-px bg-line" style={{ left: `${lx(v)}%` }} />)}
            <i className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full" style={{ left: 0, width: `${lx(r.p)}%`, background: col(r.u, true) }} />
            <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full" style={{ left: `${lx(r.p)}%`, background: col(r.u) }} />
          </span>
          <span className="text-right text-ink2 tabular-nums">{S(r.p)}</span>
        </div>
      ))}
      <div className="grid grid-cols-[76px_minmax(0,1fr)_minmax(0,1.6fr)_64px] gap-3 mt-1 text-muted">
        <span /><span />
        <span className="relative h-4">{LTICKS.map(v => <span key={v} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${lx(v)}%` }}>{v >= 1000 ? `S/ ${v / 1000}k` : S(v)}</span>)}</span>
        <span />
      </div>
    </div>
  )
}

/* 2b — mariposa: cursos cortos con IA (izquierda) frente a especializaciones y diplomados con IA (derecha) */
export function Butterfly({ data, h = 300, izqLbl = 'cursos cortos', derLbl = 'programas largos', izqTip = 'Cortos con IA', derTip = 'Especialización y diplomado con IA', paso = 10, minIzq = 0 }) {
  const lim = Math.ceil((Math.max(...data.flatMap(x => [x.corto, x.largo])) + 8) / paso) * paso  // holgura para la etiqueta del lado izquierdo
  const d = data.map(x => ({ ...x, izq: -x.corto, der: x.largo }))
  const lbl = side => ({ x, y, width, height, index }) => {
    const r = d[index]; if (!r) return null
    const a = x + Math.min(0, width), b = x + Math.max(0, width), L = side === 'izq'
    return <text x={L ? a - 6 : b + 6} y={y + height / 2 + 4} textAnchor={L ? 'end' : 'start'} fontSize={12} fontWeight={600} fill={C.ink2}>{L ? r.corto : r.largo}</text>
  }
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={d} layout="vertical" stackOffset="sign" margin={{ left: 0, right: 24, top: 4, bottom: 4 }} barCategoryGap={10}>
        {grid}
        <XAxis type="number" domain={[-lim, lim]} ticks={Array.from({ length: 2 * Math.floor(lim / paso) + 1 }, (_, i) => (i - Math.floor(lim / paso)) * paso)} tickFormatter={v => Math.abs(v)} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="u" width={80} tickLine={false} axisLine={false} tick={tickU} />
        <Tooltip {...tip} formatter={(_, k, p) => k === 'izq' ? [`${p.payload.corto} de ${p.payload.catCorto} ${izqLbl}`, izqTip] : [`${p.payload.largo} de ${p.payload.catLargo} ${derLbl}`, derTip]} />
        <Bar isAnimationActive={ANIM} dataKey="izq" stackId="s" barSize={20} radius={3} minPointSize={minIzq}>
          {d.map(x => <Cell key={x.u} fill={col(x.u)} />)}
          <LabelList dataKey="izq" content={lbl('izq')} />
        </Bar>
        <Bar isAnimationActive={ANIM} dataKey="der" stackId="s" barSize={20} radius={3} minPointSize={2}>
          {d.map(x => <Cell key={x.u} fill={isUsil(x.u) ? C.gold : C.comp} />)}
          <LabelList dataKey="der" content={lbl('der')} />
        </Bar>
        <ReferenceLine x={0} stroke={C.ink} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* 2c — dumbbell por línea: cuota de USIL en el catálogo (gris) frente a su cuota en los cursos IA (azul) */
export function Dumbbell({ data, tot, h = 340, minIA = 5, usilLbl = 'USIL' }) {
  if (!data.length) return <div className="flex items-center justify-center text-muted text-sm" style={{ height: h }}>Ninguna línea llega a {minIA} cursos IA con este filtro</div>
  const d = data.map(x => ({ ...x, rng: [Math.min(x.cat, x.ia), Math.max(x.cat, x.ia)] }))
  const max = Math.min(100, Math.ceil((Math.max(...d.map(x => x.rng[1])) + 3) / 10) * 10)
  const Shape = ({ x, y, width, height, payload }) => {
    const cy = y + height / 2, a = x + Math.min(0, width), b = x + Math.max(0, width), catLeft = payload.cat <= payload.ia
    return (
      <g>
        <line x1={a} x2={b} y1={cy} y2={cy} stroke={payload.alerta ? C.gold : C.compT} strokeWidth={payload.alerta ? 5 : 3} strokeLinecap="round" />
        <circle cx={catLeft ? a : b} cy={cy} r={6} fill={C.comp} stroke="#fff" strokeWidth={1.5} />
        <circle cx={catLeft ? b : a} cy={cy} r={6.5} fill={C.usil} stroke="#fff" strokeWidth={1.5} />
      </g>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(h, d.length * 28 + 40)}>
      <BarChart data={d} layout="vertical" margin={{ left: 0, right: 24, top: 22, bottom: 4 }} barCategoryGap={4}>
        {grid}
        <XAxis type="number" domain={[0, max]} ticks={Array.from({ length: max / 10 + 1 }, (_, i) => i * 10)} tickFormatter={v => `${v}%`} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="l" width={190} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: C.ink2 }} tickFormatter={v => v.length > 26 ? v.slice(0, 24).trimEnd() + '…' : v} />
        <ReferenceLine x={tot.cat} stroke={C.muted} strokeDasharray="4 4" label={{ value: `${usilLbl} total ${tot.cat}%`, position: 'top', fontSize: 11, fill: C.muted }} />
        <Tooltip {...tip} cursor={{ fill: 'rgba(22,32,43,.04)' }} formatter={(_, __, p) => { const x = p.payload; return [`catálogo ${x.cat}% (${x.catU} de ${x.nCat}) · IA ${x.ia}% (${x.iaU} de ${x.nIA})`, x.l] }} />
        <Bar isAnimationActive={ANIM} dataKey="rng" barSize={14} shape={Shape} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* 4 — mapa de calor líneas × institución. mode: n = cursos IA · p = precio promedio IA · t = programas totales */
export function Heat({ rows, mode, totals, unis = UNIS, aggU = [] }) {
  const N = mode === 'n', T = mode === 't', P = mode === 'p'
  const val = c => N ? c.ia : T ? c.n : c.p
  const vals = rows.flatMap(l => unis.map(u => val(l.cells[u]))).filter(Boolean)
  const max = Math.max(1, ...vals)
  const t = v => P ? Math.log(v / 100) / Math.log(max / 100) : v / max
  const style = v => v ? { background: `rgba(29,95,168,${(0.12 + 0.88 * Math.max(0, Math.min(1, t(v)))).toFixed(2)})`, color: t(v) > 0.55 ? '#fff' : C.ink } : {}
  const suma = k => totals.reduce((a, x) => a + x[k], 0)
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px] border-collapse">
        <thead><tr className="text-xs text-ink2">
          <th className="text-left py-2 px-2 font-medium border-b border-line">Línea de carrera</th>
          {unis.map(u => <th key={u} className={`text-right py-2 px-2 font-medium border-b ${isUsil(u) ? 'text-usil border-usil border-b-2' : 'border-line'}`}>{u}{aggU.includes(u) ? ' *' : ''}</th>)}
          <th className="text-right py-2 px-2 font-medium border-b border-line">{P ? 'Mercado' : T ? 'Total' : 'Total IA'}</th>
          <th className="text-right py-2 px-2 font-medium border-b border-line">{T ? 'Con IA' : 'Programas'}</th>
        </tr></thead>
        <tbody>
          {rows.filter(l => l.total).map(l => <tr key={l.l} className="hover:bg-usil-wash transition-colors duration-150">
            <td className="py-1.5 px-2 border-b border-line">{l.l}</td>
            {unis.map(u => { const c = l.cells[u], v = val(c); return <td key={u} className={`text-right py-1.5 px-2 border-b border-line ${v ? '' : 'text-comp-tint'}`} style={style(v)} title={`${c.ia} cursos IA de ${c.n}${P || c.p ? ` · promedio ${S(c.p)}` : ''}`}>{v ? (P ? S(v) : v) : (P ? '–' : '0')}</td> })}
            <td className="text-right py-1.5 px-2 border-b border-line font-semibold">{P ? S(l.pMkt) : T ? l.total : l.totalIA}</td>
            <td className="text-right py-1.5 px-2 border-b border-line text-muted">{T ? l.totalIA : l.total}</td>
          </tr>)}
          {!P && <tr className="font-semibold"><td className="py-2 px-2 border-t-2 border-line">Total</td>{unis.map(u => <td key={u} className="text-right py-2 px-2 border-t-2 border-line">{totals.find(x => x.u === u)[T ? 'total' : 'ia']}</td>)}<td className="text-right py-2 px-2 border-t-2 border-line">{suma(T ? 'total' : 'ia')}</td><td className="text-right py-2 px-2 border-t-2 border-line text-muted">{suma(T ? 'ia' : 'total')}</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

/* 5 — tipos de curso IA: prevalencia en competidores y si USIL lo tiene. Fila desplegable con los cursos. */
const Check = ({ ok }) => ok
  ? <svg viewBox="0 0 24 24" className="w-6 h-6 mx-auto" role="img" aria-label="USIL lo tiene"><circle cx="12" cy="12" r="11" fill={C.usil} /><path d="M7 12.5l3.2 3.2L17 9" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
  : <svg viewBox="0 0 24 24" className="w-6 h-6 mx-auto" role="img" aria-label="USIL no lo tiene"><circle cx="12" cy="12" r="11" fill={C.accentSoft} stroke={C.gold} /><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke={C.accent} strokeWidth="2.4" strokeLinecap="round" /></svg>
const ROW = 'grid gap-3 items-center px-3'
const DOTS = 'grid grid-cols-[repeat(5,1fr)_48px] items-center text-center'
const CORTO_U = { Continental: 'Cont.', 'U. Pacífico': 'U.Pac.', CENTRUM: 'CTRM' }

export function GroupTable({ data, comps = COMPS, usilLbl = 'USIL', extra = null, anchoComps = 250 }) {
  const cols = { gridTemplateColumns: `minmax(0,1fr) ${anchoComps}px ${Math.max(56, usilLbl.length * 8)}px` }
  return (
    <div className="overflow-x-auto">
      <div role="table" className="min-w-[600px] text-[13px]">
        <div role="row" className={`${ROW} py-2 text-xs text-ink2 border-b border-line`} style={cols}>
          <span role="columnheader">Tipo de curso con IA</span>
          <span role="columnheader" className={DOTS}>{comps.map(u => <span key={u} className="truncate px-0.5">{CORTO_U[u] || u}</span>)}<span className="text-right">Prev.</span></span>
          <span role="columnheader" className="text-center font-semibold text-usil">{usilLbl}</span>
        </div>
        {data.map(g => (
          <details key={g.g} className={`border-b border-line ${g.nUsil ? '' : 'bg-gold-soft/35'}`}>
            <summary role="row" className={`${ROW} py-2 cursor-pointer list-none hover:bg-usil-wash transition-colors duration-150`} style={cols}>
              <span role="cell" className="min-w-0">{g.g} <span className="text-muted tabular-nums">· {g.nComp + g.nUsil}</span></span>
              <span role="cell" className={DOTS}>
                {comps.map(u => <i key={u} title={u} className={`mx-auto w-3.5 h-3.5 rounded-full ${g.comps.includes(u) ? 'bg-comp' : 'border border-comp-tint'}`} />)}
                <span className="text-right tabular-nums font-semibold">{g.pct}%</span>
              </span>
              <span role="cell"><Check ok={g.nUsil > 0} /></span>
            </summary>
            <div className="px-3 pb-2 pt-1">
              {g.rs.map(r => (
                <div key={r.id || r.url} className="grid gap-2 py-0.5 text-[12.5px]" style={{ gridTemplateColumns: `84px minmax(0,1fr) ${extra ? 132 : 72}px` }}>
                  <span className={isUsil(r.u) ? 'text-usil font-semibold' : 'text-ink2'}>{r.u}</span>
                  <a href={r.url} target="_blank" rel="noopener" className="text-ink hover:text-usil no-underline">{r.n}{r.agg ? ' *' : ''}</a>
                  <span className={`text-right text-ink2 ${r.p == null && extra ? 'truncate' : 'tabular-nums'}`}>{extra ? extra(r) : S(r.p)}</span>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

/* 6 — acciones: matriz oportunidad × dificultad (color = riesgo) y tarjetas con medidores */
const LV = { Baja: 1, Bajo: 1, Media: 2, Medio: 2, Alta: 3, Alto: 3 }
export const RISK = { 1: C.usil, 2: C.comp, 3: C.gold }
const riskInk = lvl => lvl === 3 ? C.accent : '#fff'
const Bubble = ({ a, n }) => <span title={a.title} className="w-8 h-8 shrink-0 rounded-full grid place-items-center font-display text-base font-semibold" style={{ background: RISK[LV[a.riesgo]], color: riskInk(LV[a.riesgo]) }}>{n}</span>

export function ActionMatrix({ actions }) {
  const cell = (op, dif) => actions.map((a, i) => ({ a, i })).filter(({ a }) => LV[a.oportunidad] === op && LV[a.dificultad] === dif)
  return (
    <div className="grid grid-cols-[26px_minmax(0,1fr)] gap-2">
      <div className="flex items-center justify-center"><span className="[writing-mode:vertical-rl] rotate-180 text-[13px] font-semibold text-usil-deep whitespace-nowrap">Tamaño de la oportunidad ↑</span></div>
      <div>
        <div className="grid grid-cols-[40px_repeat(3,1fr)] grid-rows-[repeat(3,72px)_22px] gap-1 text-xs text-ink2">
          {[3, 2, 1].flatMap(op => [
            <span key={'y' + op} className="flex items-center justify-end pr-1">{['', 'Baja', 'Media', 'Alta'][op]}</span>,
            ...[1, 2, 3].map(dif => (
              <div key={op + '-' + dif} className={`rounded-md flex flex-wrap items-center justify-center gap-1.5 ${op === 3 && dif < 3 ? 'bg-gold-soft' : 'bg-bg'}`}>
                {cell(op, dif).map(({ a, i }) => <Bubble key={i} a={a} n={i + 1} />)}
              </div>
            )),
          ])}
          <span />{['Baja', 'Media', 'Alta'].map(t => <span key={t} className="text-center self-end">{t}</span>)}
        </div>
        <div className="text-center text-[13px] font-semibold text-usil-deep mt-1.5 pl-10">Dificultad de implementación →</div>
      </div>
    </div>
  )
}

const Meter = ({ label, level, good }) => (
  <div className="flex items-center gap-3 text-[13px]">
    <span className="w-24 text-ink2">{label}</span>
    <span className="flex gap-1">{[1, 2, 3].map(k => <i key={k} className="w-7 h-3 rounded-sm" style={{ background: k <= LV[level] ? (good ? C.usil : (LV[level] === 3 ? C.gold : C.comp)) : C.line }} />)}</span>
    <span className="font-semibold text-ink">{level}</span>
  </div>
)

/* Una acción por fila: cabecera grande con medidores y variables; al desplegar, el porqué de cada etiqueta. */
export function ActionRow({ a, i }) {
  const whys = [['Oportunidad', a.oportunidad, a.oportunidad_why], ['Riesgo', a.riesgo, a.riesgo_why], ['Dificultad', a.dificultad, a.dificultad_why]]
  return (
    <details className="group bg-surface rounded-lg border border-line">
      <summary className="list-none cursor-pointer grid lg:grid-cols-[minmax(0,1fr)_280px_240px_24px] gap-6 items-center p-6 hover:bg-usil-wash/60 transition-colors duration-150 rounded-lg">
        <div className="flex items-start gap-4 min-w-0">
          <span className="w-12 h-12 shrink-0 rounded-full grid place-items-center font-display text-2xl font-semibold" style={{ background: RISK[LV[a.riesgo]], color: riskInk(LV[a.riesgo]) }}>{i + 1}</span>
          <div className="min-w-0">
            <h3 className="text-[22px] leading-tight m-0">{a.title}</h3>
            <p className="text-[14px] text-ink2 m-0 mt-1.5">{a.detail}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Meter label="Oportunidad" level={a.oportunidad} good />
          <Meter label="Riesgo" level={a.riesgo} />
          <Meter label="Dificultad" level={a.dificultad} />
        </div>
        <div className="flex flex-wrap gap-1.5">{a.variables.map(v => <span key={v} className="px-2.5 py-1 rounded-full bg-usil-wash text-usil-deep text-[12px]">{v}</span>)}</div>
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-muted transition-transform duration-200 group-open:rotate-180" aria-hidden><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
      </summary>
      <div className="grid md:grid-cols-3 gap-6 px-6 pb-6 pt-4 border-t border-line">
        {whys.map(([k, lvl, why]) => (
          <div key={k}>
            <div className="text-[12px] font-semibold text-usil-deep mb-1">{k} · {lvl}</div>
            <p className="text-[13px] text-ink2 m-0 leading-relaxed">{why}</p>
          </div>
        ))}
      </div>
    </details>
  )
}
