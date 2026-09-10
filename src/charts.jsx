import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ResponsiveContainer, ScatterChart, Scatter, ZAxis, ReferenceArea, ReferenceLine } from 'recharts'
import { UNIS, S, isUsil } from './stats'

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
  const inView = useInView(ref, { once: true, amount: 0.25 })
  const reduce = useReducedMotion()
  return (
    <motion.div ref={ref} className={`min-w-0 ${className}`} initial={reduce ? false : { opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}>
      {inView ? children : <div style={{ minHeight: minH }} />}
    </motion.div>
  )
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

/* 1c — jitter de precios: cada punto es un programa */
export function Jitter({ points, unis, h = 380 }) {
  const meds = UNIS.map((u, i) => ({ i, u, ia: unis.find(x => x.u === u)?.medIA, no: unis.find(x => x.u === u)?.medNo }))
  return (
    <ResponsiveContainer width="100%" height={h}>
      <ScatterChart margin={{ left: 0, right: 20, top: 10, bottom: 4 }}>
        <CartesianGrid stroke={C.line} vertical={false} />
        <XAxis type="number" dataKey="x" domain={[-0.5, UNIS.length - 0.5]} ticks={UNIS.map((_, i) => i)} tickFormatter={i => UNIS[i]} tickLine={false} axisLine={false} tick={({ x, y, payload }) => <text x={x} y={y} dy={14} textAnchor="middle" fontSize={12} fontWeight={500} fill={isUsil(UNIS[payload.value]) ? C.usil : C.ink2}>{UNIS[payload.value]}</text>} />
        <YAxis type="number" dataKey="y" scale="log" domain={[80, 20000]} ticks={[100, 200, 500, 1000, 2000, 5000, 10000]} tickFormatter={S} width={84} tickLine={false} axisLine={false} />
        <ZAxis range={[36, 36]} />
        <Tooltip {...tip} cursor={false} content={({ payload }) => payload?.length ? <div style={tip.contentStyle} className="px-3 py-2 max-w-[280px]"><div className="font-semibold">{payload[0].payload.u} · {payload[0].payload.ia ? 'con IA' : 'sin IA'}</div><div>{payload[0].payload.n}</div><div>{S(payload[0].payload.y)} · {payload[0].payload.t}</div></div> : null} />
        {meds.map(m => m.no && <ReferenceLine key={m.u + 'n'} segment={[{ x: m.i - 0.36, y: m.no }, { x: m.i + 0.36, y: m.no }]} stroke={col(m.u, true)} strokeWidth={3} />)}
        {meds.map(m => m.ia && <ReferenceLine key={m.u + 'i'} segment={[{ x: m.i - 0.36, y: m.ia }, { x: m.i + 0.36, y: m.ia }]} stroke={col(m.u)} strokeWidth={3} />)}
        <Scatter isAnimationActive={ANIM} data={points.filter(p => !p.ia)} fillOpacity={0.55}>{points.filter(p => !p.ia).map((p, i) => <Cell key={i} fill={col(p.u, true)} />)}</Scatter>
        <Scatter isAnimationActive={ANIM} data={points.filter(p => p.ia)} fillOpacity={0.9} stroke="#fff" strokeWidth={1}>{points.filter(p => p.ia).map((p, i) => <Cell key={i} fill={col(p.u)} />)}</Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}

/* 2a — mapa competitivo con cuadrante ideal */
export function Mapa({ view, unis, mkt, cl, h = 440 }) {
  const A = view === 'A', B = view === 'B'
  const pts = A ? unis.filter(u => u.avgIA && u.pct != null).map(u => ({ u: u.u, x: u.pct, y: u.avgIA, z: u.total, d: u }))
    : B ? unis.filter(u => u.ranking && u.pct != null).map(u => ({ u: u.u, x: u.ranking, y: u.pct, z: u.total, d: u }))
    : cl.filter(u => u.x != null && u.y != null).map(u => ({ u: u.u, x: u.x, y: u.y, z: u.nC + u.nL, d: u }))
  const qx = A ? mkt.pct : B ? 107 : mkt.pctC, qy = A ? mkt.medIA : mkt.pct
  const qyC = B ? null : (A ? null : mkt.pctL)
  const yq = A ? qy : B ? qy : qyC
  const mx = Math.max(0, ...pts.map(p => p.x)), my = Math.max(0, ...pts.map(p => p.y))
  const xMax = B ? 420 : Math.max(40, Math.ceil((mx + 4) / 10) * 10), yMax = A ? Math.max(12000, Math.ceil(my * 1.4 / 1000) * 1000) : B ? Math.max(40, Math.ceil((my + 4) / 10) * 10) : Math.max(80, Math.ceil((my + 4) / 10) * 10)
  const POS = B ? { USIL: 'left', ULima: 'left' } : (!A ? { USIL: 'bottom', PUCP: 'top', ULima: 'left', UPC: 'right' } : { USIL: 'left' })
  return (
    <ResponsiveContainer width="100%" height={h}>
      <ScatterChart margin={{ left: 0, right: 60, top: 10, bottom: 10 }}>
        <CartesianGrid stroke={C.line} />
        <XAxis type="number" dataKey="x" domain={B ? [10, xMax] : [0, xMax]} reversed={B} tickLine={false} axisLine={false} tickFormatter={v => B ? `#${v}` : `${v}%`} />
        <YAxis type="number" dataKey="y" scale={A ? 'log' : 'auto'} domain={A ? [100, yMax] : [0, yMax]} ticks={A ? [100, 200, 500, 1000, 2000, 5000, 10000] : undefined} tickFormatter={v => A ? S(v) : `${v}%`} width={A ? 84 : 56} tickLine={false} axisLine={false} />
        <ZAxis type="number" dataKey="z" range={A || B ? [300, 1600] : [160, 700]} />
        <ReferenceArea x1={B ? 10 : qx} x2={B ? qx : xMax} y1={yq} y2={A ? yMax : yMax} fill={C.accentSoft} fillOpacity={0.9} stroke="none" label={{ value: 'CUADRANTE IDEAL', position: A ? 'insideBottomRight' : 'insideTopRight', fill: C.accent, fontSize: 12, fontWeight: 600 }} />
        <ReferenceLine x={qx} stroke={C.muted} strokeDasharray="4 4" label={{ value: A ? `Mercado ${qx}%` : B ? 'Mediana #107' : `Mercado ${qx}%`, position: A || B ? 'insideBottomLeft' : 'insideTopLeft', fontSize: 11, fill: C.muted }} />
        <ReferenceLine y={yq} stroke={C.muted} strokeDasharray="4 4" label={{ value: A ? `Mediana ${S(yq)}` : `Mercado ${yq}%`, position: B ? 'insideRight' : 'insideLeft', fontSize: 11, fill: C.muted }} />
        <Tooltip {...tip} cursor={false} content={({ payload }) => payload?.length ? <div style={tip.contentStyle} className="px-3 py-2">{(() => { const d = payload[0].payload.d; return <><div className="font-semibold">{payload[0].payload.u}</div>{A || B ? <><div>{d.pct}% con IA ({d.ia} de {d.total})</div><div>Precio promedio IA {S(d.avgIA)}</div><div>Ranking QS: {d.ranking ? '#' + d.ranking : 's/d'}</div></> : <><div>Cursos cortos: {d.x}% con IA (n={d.nC})</div><div>Especializaciones y diplomados: {d.y}% con IA (n={d.nL})</div></>}</> })()}</div> : null} />
        <Scatter isAnimationActive={ANIM} data={pts} stroke="#fff" strokeWidth={2}>
          {pts.map(p => <Cell key={p.u} fill={isUsil(p.u) ? C.usil : C.comp} />)}
          <LabelList dataKey="u" content={({ x, y, value, index }) => { const p = pts[index]; const pos = POS[p.u] || 'right'; const r = (A || B ? 8 + Math.sqrt(p.z) * 1.2 : 5 + Math.sqrt(p.z) * 0.8); const dx = pos === 'left' ? -r - 4 : pos === 'right' ? r + 4 : 0, dy = pos === 'top' ? -r - 4 : pos === 'bottom' ? r + 14 : 4; return <text x={x + dx} y={y + dy} textAnchor={pos === 'left' ? 'end' : pos === 'right' ? 'start' : 'middle'} fontSize={13} fontWeight={600} fill={isUsil(p.u) ? C.usil : C.ink2}>{value}</text> }} />
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}

/* 2b — prevalencia por tipo (100% apilado) */
export function PrevTipo({ data, h = 260 }) {
  const d = data.filter(x => x.total).map(x => ({ ...x, pIA: x.pct, pNo: +(100 - x.pct).toFixed(1) })).sort((a, b) => b.pIA - a.pIA)
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={d} layout="vertical" margin={{ left: 0, right: 90, top: 4, bottom: 4 }} barCategoryGap={8}>
        <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="u" width={80} tickLine={false} axisLine={false} tick={tickU} />
        <Tooltip {...tip} formatter={(v, k, p) => [k === 'pIA' ? `${p.payload.ia} cursos (${v}%)` : `${p.payload.noia} cursos (${v}%)`, k === 'pIA' ? 'Con IA' : 'Sin IA']} />
        <Bar isAnimationActive={ANIM} dataKey="pIA" stackId="a" barSize={18}>{d.map(x => <Cell key={x.u} fill={col(x.u)} />)}</Bar>
        <Bar isAnimationActive={ANIM} dataKey="pNo" stackId="a" barSize={18} radius={[0, 3, 3, 0]}>
          {d.map(x => <Cell key={x.u} fill={col(x.u, true)} />)}
          <LabelList dataKey="pIA" position="right" formatter={v => `${v}% IA`} style={{ fill: C.ink2, fontSize: 12, fontWeight: 500 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/* 3a — % que sube el precio con IA, por universidad, escala 0-100 */
export function Premium({ data, h = 300 }) {
  const d = data.map(x => ({ ...x, v: x.prem == null ? 100 : Math.min(100, Math.max(0, x.prem)), lbl: x.prem == null ? 's/d' : `${x.prem > 0 ? '+' : ''}${x.prem}%` }))
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={d} margin={{ left: 0, right: 10, top: 24, bottom: 4 }} barCategoryGap={18}>
        <defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#fff" /><rect width="2" height="6" fill={C.compT} /></pattern></defs>
        <CartesianGrid stroke={C.line} vertical={false} />
        <XAxis dataKey="u" interval={0} tickLine={false} axisLine={false} tick={tickUb} />
        <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={v => `${v}%`} width={48} tickLine={false} axisLine={false} />
        <Tooltip {...tip} cursor={{ fill: 'rgba(22,32,43,.04)' }} formatter={(_, __, p) => [p.payload.prem == null ? 'no publica precio en cursos sin IA' : `${p.payload.lbl} · IA n=${p.payload.nIA}, sin IA n=${p.payload.nNo}`, 'Variación con IA']} />
        <Bar isAnimationActive={ANIM} dataKey="v" barSize={38} radius={[3, 3, 0, 0]} minPointSize={2}>
          {d.map(x => <Cell key={x.u} fill={x.prem == null ? 'url(#hatch)' : col(x.u)} />)}
          <LabelList dataKey="lbl" position="top" style={{ fill: C.ink2, fontSize: 12, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/* 3b — variación por línea dentro de USIL, escala 0-100 */
export function PremiumLinea({ data, h = 320 }) {
  const d = data.map(x => ({ ...x, v: Math.min(100, Math.max(0, x.prem)), lbl: `${x.prem > 0 ? '+' : ''}${x.prem}%` }))
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={d} layout="vertical" margin={{ left: 0, right: 60, top: 4, bottom: 4 }} barCategoryGap={6}>
        {grid}
        <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={v => `${v}%`} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="l" width={190} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: C.ink2 }} tickFormatter={v => v.length > 28 ? v.slice(0, 27) + '…' : v} />
        <Tooltip {...tip} formatter={(_, __, p) => [`${p.payload.lbl} · IA n=${p.payload.nIA}, sin IA n=${p.payload.nNo}`, p.payload.l]} />
        <Bar isAnimationActive={ANIM} dataKey="v" barSize={14} radius={[0, 3, 3, 0]} minPointSize={2}>
          {d.map(x => <Cell key={x.l} fill={x.prem >= 0 ? C.usil : C.usilT} />)}
          <LabelList dataKey="lbl" position="right" style={{ fill: C.ink2, fontSize: 12, fontWeight: 600 }} />
        </Bar>
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
