import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ResponsiveContainer, ScatterChart, Scatter, ZAxis, ReferenceArea, ReferenceLine } from 'recharts'
import { UNIS, COMPS, S, isUsil } from './stats'

const ANIM = typeof location === 'undefined' || !location.search.includes('static')
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
    if (!inView) return
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

/* 1a — prevalencia apilada */
export function Prevalence({ data, h = 300 }) {
  const d = [...data].filter(x => x.total).sort((a, b) => b.ia - a.ia)
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={d} layout="vertical" margin={{ left: 0, right: 90, top: 4, bottom: 4 }} barCategoryGap={10}>
        {grid}
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="u" width={80} tickLine={false} axisLine={false} tick={tickU} />
        <Tooltip {...tip} formatter={(v, k) => [v, k === 'ia' ? 'Con IA' : 'Sin IA']} />
        <Bar isAnimationActive={ANIM} dataKey="ia" stackId="a" name="ia" barSize={22}>{d.map(x => <Cell key={x.u} fill={col(x.u)} />)}</Bar>
        <Bar isAnimationActive={ANIM} dataKey="noia" stackId="a" name="noia" barSize={22} radius={[0, 3, 3, 0]}>
          {d.map(x => <Cell key={x.u} fill={col(x.u, true)} />)}
          <LabelList dataKey="pct" position="right" formatter={v => v == null ? '' : `${v}% con IA`} style={{ fill: C.ink2, fontSize: 12, fontWeight: 500 }} />
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
export function Jitter({ points, unis, h = 380 }) {
  const n = UNIS.length, xp = x => 100 * (x + 0.5) / n
  const med = UNIS.map((u, i) => { const x = unis.find(k => k.u === u); return { u, i, ia: x?.medIA, no: x?.medNo } })
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
        <div className="grid mt-2" style={{ gridTemplateColumns: `repeat(${n}, minmax(0,1fr))` }}>{UNIS.map(u => <span key={u} className={`text-center font-medium ${isUsil(u) ? 'text-usil' : 'text-ink2'}`}>{u}</span>)}</div>
      </div>
    </div>
  )
}

/* 2a — mapa competitivo con cuadrante ideal (A: prevalencia × precio, B: ranking × prevalencia) */
/* Punto del mapa. USIL lleva un anillo SVG que se expande y desvanece 3 veces (no usa CSS transform: en SVG pisaría el translate de Recharts). */
const MapDot = ({ cx, cy, width, payload, ping }) => {
  const r = width / 2, us = isUsil(payload.u)
  return (
    <g>
      {us && ping && <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.usil} strokeWidth={2}>
        <animate attributeName="r" from={r} to={r + 20} dur="1.6s" begin="0.6s" repeatCount="3" fill="freeze" />
        <animate attributeName="opacity" from="0.9" to="0" dur="1.6s" begin="0.6s" repeatCount="3" fill="freeze" />
      </circle>}
      <circle cx={cx} cy={cy} r={r} fill={us ? C.usil : C.comp} stroke="#fff" strokeWidth={2} />
    </g>
  )
}

export function Mapa({ view, unis, mkt, h = 440 }) {
  const A = view === 'A'
  const ping = ANIM && !useReducedMotion()
  const pts = A ? unis.filter(u => u.avgIA && u.pct != null).map(u => ({ u: u.u, x: u.pct, y: u.avgIA, z: u.total, d: u }))
    : unis.filter(u => u.ranking && u.pct != null).map(u => ({ u: u.u, x: u.ranking, y: u.pct, z: u.total, d: u }))
  const qx = A ? mkt.pct : 107, yq = A ? mkt.medIA : mkt.pct
  const my = Math.max(0, ...pts.map(p => p.y)), mx = Math.max(0, ...pts.map(p => p.x))
  const xMax = A ? Math.max(40, Math.ceil((mx + 4) / 10) * 10) : 420
  const yMax = A ? Math.max(12000, Math.ceil(my * 1.4 / 1000) * 1000) : Math.max(40, Math.ceil((my + 4) / 10) * 10)
  const POS = A ? { USIL: 'left' } : { USIL: 'left', ULima: 'left' }
  return (
    <ResponsiveContainer width="100%" height={h}>
      <ScatterChart margin={{ left: 0, right: 60, top: 10, bottom: 10 }}>
        <CartesianGrid stroke={C.line} />
        <XAxis type="number" dataKey="x" domain={A ? [0, xMax] : [10, xMax]} reversed={!A} tickLine={false} axisLine={false} tickFormatter={v => A ? `${v}%` : `#${v}`} />
        <YAxis type="number" dataKey="y" scale={A ? 'log' : 'auto'} domain={A ? [100, yMax] : [0, yMax]} ticks={A ? [100, 200, 500, 1000, 2000, 5000, 10000] : undefined} tickFormatter={v => A ? S(v) : `${v}%`} width={A ? 84 : 56} tickLine={false} axisLine={false} />
        <ZAxis type="number" dataKey="z" range={[300, 1600]} />
        <ReferenceArea x1={A ? qx : 10} x2={A ? xMax : qx} y1={yq} y2={yMax} fill={C.accentSoft} fillOpacity={0.9} stroke="none" label={{ value: 'CUADRANTE IDEAL', position: A ? 'insideBottomRight' : 'insideTopRight', fill: C.accent, fontSize: 12, fontWeight: 600 }} />
        <ReferenceLine x={qx} stroke={C.muted} strokeDasharray="4 4" label={{ value: A ? `Mercado ${qx}%` : 'Mediana #107', position: 'insideBottomLeft', fontSize: 11, fill: C.muted }} />
        <ReferenceLine y={yq} stroke={C.muted} strokeDasharray="4 4" label={{ value: A ? `Mediana ${S(yq)}` : `Mercado ${yq}%`, position: A ? 'insideLeft' : 'insideRight', fontSize: 11, fill: C.muted }} />
        <Tooltip {...tip} cursor={false} content={({ payload }) => payload?.length ? <div style={tip.contentStyle} className="px-3 py-2">{(() => { const d = payload[0].payload.d; return <><div className="font-semibold">{d.u}</div><div>{d.pct}% con IA ({d.ia} de {d.total})</div><div>Precio promedio IA {S(d.avgIA)}</div><div>Ranking QS: {d.ranking ? '#' + d.ranking : 's/d'}</div></> })()}</div> : null} />
        <Scatter isAnimationActive={ANIM} data={pts} shape={props => <MapDot {...props} ping={ping} />}>
          <LabelList dataKey="u" content={({ x, y, value, index }) => { const p = pts[index]; if (!p) return null; const left = POS[p.u] === 'left'; const r = 8 + Math.sqrt(p.z) * 1.2; return <text x={x + (left ? -r - 4 : r + 4)} y={y + 4} textAnchor={left ? 'end' : 'start'} fontSize={13} fontWeight={600} fill={isUsil(p.u) ? C.usil : C.ink2}>{value}</text> }} />
        </Scatter>
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

/* 2b — mariposa: cursos cortos con IA (izquierda) frente a especializaciones y diplomados con IA (derecha) */
export function Butterfly({ data, h = 300 }) {
  const lim = Math.ceil((Math.max(...data.flatMap(x => [x.corto, x.largo])) + 8) / 10) * 10  // holgura para la etiqueta del lado izquierdo
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
        <XAxis type="number" domain={[-lim, lim]} ticks={Array.from({ length: 2 * Math.floor(lim / 10) + 1 }, (_, i) => (i - Math.floor(lim / 10)) * 10)} tickFormatter={v => Math.abs(v)} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="u" width={80} tickLine={false} axisLine={false} tick={tickU} />
        <Tooltip {...tip} formatter={(_, k, p) => k === 'izq' ? [`${p.payload.corto} de ${p.payload.catCorto} cursos cortos`, 'Cortos con IA'] : [`${p.payload.largo} de ${p.payload.catLargo} programas largos`, 'Especialización y diplomado con IA']} />
        <Bar isAnimationActive={ANIM} dataKey="izq" stackId="s" barSize={20} radius={3}>
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
export function Dumbbell({ data, tot, h = 340 }) {
  if (!data.length) return <div className="flex items-center justify-center text-muted text-sm" style={{ height: h }}>Ninguna línea llega a 5 cursos IA con este filtro</div>
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
        <ReferenceLine x={tot.cat} stroke={C.muted} strokeDasharray="4 4" label={{ value: `USIL total ${tot.cat}%`, position: 'top', fontSize: 11, fill: C.muted }} />
        <Tooltip {...tip} cursor={{ fill: 'rgba(22,32,43,.04)' }} formatter={(_, __, p) => { const x = p.payload; return [`catálogo ${x.cat}% (${x.catU} de ${x.nCat}) · IA ${x.ia}% (${x.iaU} de ${x.nIA})`, x.l] }} />
        <Bar isAnimationActive={ANIM} dataKey="rng" barSize={14} shape={Shape} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* 4 — mapa de calor líneas × universidad */
export function Heat({ rows, mode, totals }) {
  const N = mode === 'n'
  const vals = rows.flatMap(l => UNIS.map(u => N ? l.cells[u].ia : l.cells[u].p)).filter(Boolean)
  const max = Math.max(1, ...vals)
  const t = v => N ? v / max : Math.log(v / 100) / Math.log(max / 100)
  const style = v => v ? { background: `rgba(29,95,168,${(0.12 + 0.88 * Math.max(0, Math.min(1, t(v)))).toFixed(2)})`, color: t(v) > 0.55 ? '#fff' : C.ink } : {}
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px] border-collapse">
        <thead><tr className="text-xs text-ink2">
          <th className="text-left py-2 px-2 font-medium border-b border-line">Línea de carrera</th>
          {UNIS.map(u => <th key={u} className={`text-right py-2 px-2 font-medium border-b ${isUsil(u) ? 'text-usil border-usil border-b-2' : 'border-line'}`}>{u}</th>)}
          <th className="text-right py-2 px-2 font-medium border-b border-line">{N ? 'Total IA' : 'Mercado'}</th>
          <th className="text-right py-2 px-2 font-medium border-b border-line">Programas</th>
        </tr></thead>
        <tbody>
          {rows.filter(l => l.total).map(l => <tr key={l.l} className="hover:bg-usil-wash transition-colors duration-150">
            <td className="py-1.5 px-2 border-b border-line">{l.l}</td>
            {UNIS.map(u => { const c = l.cells[u], v = N ? c.ia : c.p; return <td key={u} className={`text-right py-1.5 px-2 border-b border-line ${v ? '' : 'text-comp-tint'}`} style={style(v)} title={`${c.ia} cursos IA de ${c.n} · promedio ${S(c.p)}`}>{v ? (N ? v : S(v)) : (N ? '0' : '–')}</td> })}
            <td className="text-right py-1.5 px-2 border-b border-line font-semibold">{N ? l.totalIA : S(l.pMkt)}</td>
            <td className="text-right py-1.5 px-2 border-b border-line text-muted">{l.total}</td>
          </tr>)}
          {N && <tr className="font-semibold"><td className="py-2 px-2 border-t-2 border-line">Total</td>{UNIS.map(u => <td key={u} className="text-right py-2 px-2 border-t-2 border-line">{totals.find(x => x.u === u).ia}</td>)}<td className="text-right py-2 px-2 border-t-2 border-line">{totals.reduce((a, x) => a + x.ia, 0)}</td><td className="text-right py-2 px-2 border-t-2 border-line text-muted">{totals.reduce((a, x) => a + x.total, 0)}</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

/* 5 — tipos de curso IA: prevalencia en competidores y si USIL lo tiene. Fila desplegable con los cursos. */
const Check = ({ ok }) => ok
  ? <svg viewBox="0 0 24 24" className="w-6 h-6 mx-auto" role="img" aria-label="USIL lo tiene"><circle cx="12" cy="12" r="11" fill={C.usil} /><path d="M7 12.5l3.2 3.2L17 9" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
  : <svg viewBox="0 0 24 24" className="w-6 h-6 mx-auto" role="img" aria-label="USIL no lo tiene"><circle cx="12" cy="12" r="11" fill={C.accentSoft} stroke={C.gold} /><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke={C.accent} strokeWidth="2.4" strokeLinecap="round" /></svg>
const ROW = 'grid grid-cols-[minmax(0,1fr)_250px_56px] gap-3 items-center px-3'
const DOTS = 'grid grid-cols-[repeat(5,1fr)_48px] items-center text-center'

export function GroupTable({ data }) {
  return (
    <div className="overflow-x-auto">
      <div role="table" className="min-w-[600px] text-[13px]">
        <div role="row" className={`${ROW} py-2 text-xs text-ink2 border-b border-line`}>
          <span role="columnheader">Tipo de curso con IA</span>
          <span role="columnheader" className={DOTS}>{COMPS.map(u => <span key={u}>{u === 'Continental' ? 'Cont.' : u}</span>)}<span className="text-right">Prev.</span></span>
          <span role="columnheader" className="text-center font-semibold text-usil">USIL</span>
        </div>
        {data.map(g => (
          <details key={g.g} className={`border-b border-line ${g.nUsil ? '' : 'bg-gold-soft/35'}`}>
            <summary role="row" className={`${ROW} py-2 cursor-pointer list-none hover:bg-usil-wash transition-colors duration-150`}>
              <span role="cell" className="min-w-0">{g.g} <span className="text-muted tabular-nums">· {g.nComp + g.nUsil}</span></span>
              <span role="cell" className={DOTS}>
                {COMPS.map(u => <i key={u} title={u} className={`mx-auto w-3.5 h-3.5 rounded-full ${g.comps.includes(u) ? 'bg-comp' : 'border border-comp-tint'}`} />)}
                <span className="text-right tabular-nums font-semibold">{g.pct}%</span>
              </span>
              <span role="cell"><Check ok={g.nUsil > 0} /></span>
            </summary>
            <div className="px-3 pb-2 pt-1">
              {g.rs.map(r => (
                <div key={r.url} className="grid grid-cols-[84px_1fr_72px] gap-2 py-0.5 text-[12.5px]">
                  <span className={isUsil(r.u) ? 'text-usil font-semibold' : 'text-ink2'}>{r.u}</span>
                  <a href={r.url} target="_blank" rel="noopener" className="text-ink hover:text-usil no-underline">{r.n}</a>
                  <span className="text-right text-ink2 tabular-nums">{S(r.p)}</span>
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
