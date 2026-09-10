import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { TIPOS, S, filt, byUni, mercado, premiumByUni, escalera, heat, grupos, pricePoints, formatos, cuotaLineas, FECHA, RANKING_FUENTE, MIN_IA } from './stats'
import * as CH from './charts'
const { Reveal, Counter, Segmented, Legend, ActionRow, RISK, C } = CH
// Gráficos memorizados: un cambio de estado que no les toca (vista del mapa, modo del mapa de calor, filtro de la tabla) no los vuelve a dibujar.
const [Prevalence, PerHour, Jitter, Mapa, Butterfly, Dumbbell, Premium, PriceLadder, Heat, GroupTable, ActionMatrix] =
  [CH.Prevalence, CH.PerHour, CH.Jitter, CH.Mapa, CH.Butterfly, CH.Dumbbell, CH.Premium, CH.PriceLadder, CH.Heat, CH.GroupTable, CH.ActionMatrix].map(c => memo(c))
import { ACCIONES, VARIABLES } from './acciones'

const TIPO_OPTS = ['Todos', ...TIPOS]
const SECTIONS = [
  ['p1', 'Quién tiene más IA y a qué precio'],
  ['p2', 'Dónde está USIL en el mapa'],
  ['p3', 'Cuánto sube el precio con IA'],
  ['p4', 'Dónde hay oferta y dónde falta'],
  ['p5', 'Lo que otros venden y USIL no'],
  ['p6', 'Cinco acciones'],
]

/* Un solo patrón de panel: cabecera (título + control), cuerpo, aclaración. */
const Panel = ({ title, aside, caption, children, className = '' }) => (
  <section className={`bg-surface rounded-lg border border-line min-w-0 overflow-hidden ${className}`}>
    <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-line">
      <h3 className="text-[17px] m-0">{title}</h3>
      {aside}
    </header>
    <div className="px-5 pt-4 pb-3">{children}</div>
    {caption && <p className="text-xs text-muted px-5 pb-3 m-0">{caption}</p>}
  </section>
)
const SectionTitle = ({ id, n, children }) => (
  <motion.div id={id} className="scroll-mt-20 flex items-baseline gap-4 mb-5" initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
    <span className="font-display text-4xl leading-none text-usil-tint">{n}</span>
    <h2 className="text-[26px] leading-tight m-0">{children}</h2>
  </motion.div>
)
const Kpi = ({ label, value, sub, delay = 0, format }) => (
  <motion.div className="bg-surface rounded-lg border border-line px-4 py-3 min-w-0" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}>
    <div className="text-xs text-muted truncate">{label}</div>
    <div className="num text-[34px] leading-tight text-usil-deep">{typeof value === 'number' || value === null ? <Counter value={value} format={format} /> : value}</div>
    <div className="text-xs text-ink2 truncate">{sub}</div>
  </motion.div>
)

/* Scroll: la barra de progreso y la sección activa tienen su propio estado (y la barra ni siquiera usa estado: escribe el estilo directo).
   Antes vivían en App y cada píxel de scroll volvía a dibujar los 8 gráficos. */
const onScrollFrame = fn => {
  let raf = 0
  const h = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; fn() }) }
  fn(); addEventListener('scroll', h, { passive: true }); addEventListener('resize', h)
  return () => { removeEventListener('scroll', h); removeEventListener('resize', h); cancelAnimationFrame(raf) }
}
function ProgressBar() {
  const ref = useRef(null)
  useEffect(() => onScrollFrame(() => { if (ref.current) ref.current.style.transform = `scaleY(${Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight))})` }), [])
  return <div ref={ref} className="hidden lg:block absolute left-0 top-0 w-1 h-full bg-gold origin-top" style={{ transform: 'scaleY(0)' }} aria-hidden />
}
function SideNav() {
  const [active, setActive] = useState('p1')
  useEffect(() => onScrollFrame(() => {
    const line = innerHeight * 0.4
    let cur = SECTIONS[0][0]
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= line) cur = id })
    setActive(cur)
  }), [])
  return (
    <nav className="hidden lg:block" aria-label="Secciones">
      {SECTIONS.map(([id, t], i) => (
        <a key={id} href={`#${id}`} className={`flex items-baseline gap-3 py-2 text-[13px] no-underline border-l-2 pl-3 -ml-px transition-colors duration-150 ${active === id ? 'border-gold text-white' : 'border-transparent text-white/60 hover:text-white'}`}>
          <span className="font-display text-base w-4">{i + 1}</span><span>{t}</span>
        </a>
      ))}
    </nav>
  )
}

export default function App() {
  const q = new URLSearchParams(location.search)  // ?tipo=Curso%20corto&view=B para enlaces directos y capturas
  const [tipo, setTipo] = useState(TIPO_OPTS.includes(q.get('tipo')) ? q.get('tipo') : 'Todos')
  const [view, setView] = useState(q.get('view') === 'B' ? 'B' : 'A')
  const [heatMode, setHeatMode] = useState('n')
  const [soloBrechas, setSoloBrechas] = useState('Todos')

  const rows = useMemo(() => filt(tipo), [tipo])
  const unis = useMemo(() => byUni(rows), [rows])
  const mkt = useMemo(() => mercado(rows), [rows])
  const usil = unis.find(u => u.u === 'USIL')
  const rankPrev = [...unis].filter(u => u.pct != null).sort((a, b) => b.pct - a.pct).findIndex(u => u.u === 'USIL') + 1
  const points = useMemo(() => pricePoints(rows), [rows])
  const fmts = useMemo(() => formatos(), [])
  const cuota = useMemo(() => cuotaLineas(rows), [rows])
  const heatRows = useMemo(() => heat(rows), [rows])
  const gs = useMemo(() => grupos(rows), [rows])
  const brechas = useMemo(() => gs.filter(g => !g.nUsil && g.k), [gs])
  const premUni = useMemo(() => premiumByUni(tipo), [tipo])
  const ladder = useMemo(() => escalera(rows), [rows])

  return (
    <div className="lg:grid lg:grid-cols-[240px_1fr] min-h-dvh">
      {/* Barra lateral: marca, navegación por secciones y filtro global */}
      <aside className="relative lg:sticky lg:top-0 lg:h-dvh bg-usil-deep text-white px-5 py-5 flex flex-col gap-5">
        <ProgressBar />
        <div>
          <div className="font-semibold leading-tight">USIL · Educación Continua</div>
          <div className="text-xs text-white/60 mt-1">Benchmark IA · {FECHA}</div>
        </div>
        <SideNav />
        <div>
          <div className="text-[11px] uppercase tracking-wide text-white/50 mb-2">Tipo de curso</div>
          <div className="flex flex-wrap gap-1.5">
            {TIPO_OPTS.map(o => <button key={o} onClick={() => setTipo(o)} aria-pressed={tipo === o} className={`px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors duration-150 ${tipo === o ? 'bg-gold text-usil-deep font-semibold' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}>{o}</button>)}
          </div>
        </div>
      </aside>

      <main className="px-5 lg:px-10 py-8 max-w-[1180px] w-full min-w-0 overflow-x-clip">
        <motion.h1 className="text-[34px] lg:text-[40px] leading-[1.1] text-usil-deep m-0 mb-1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>IA en la educación continua: USIL frente al mercado</motion.h1>
        <p className="text-xs text-muted m-0 mb-6">USIL · UPC · PUCP · ULima · UTEC · Continental{tipo !== 'Todos' ? ` · filtro: ${tipo}` : ''}</p>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-10">
          <Kpi label="Cursos con IA en el mercado" value={mkt.ia} sub={`de ${mkt.total} programas · ${mkt.pct}%`} />
          <Kpi label="Prevalencia USIL" value={usil.pct ?? 0} format={v => `${v.toFixed(1)}%`} sub={`${usil.ia} de ${usil.total} · ${rankPrev ? rankPrev + '° de 6' : 's/d'}`} delay={0.05} />
          <Kpi label="Precio curso IA USIL" value={usil.avgIA} format={S} sub={`mediana mercado ${S(mkt.medIA)}`} delay={0.1} />
          <Kpi label="Precio por hora USIL" value={usil.ph ?? null} format={v => `S/ ${Math.round(v)}`} sub={`UPC S/ ${unis.find(u => u.u === 'UPC').ph ?? 's/d'} · PUCP S/ ${unis.find(u => u.u === 'PUCP').ph ?? 's/d'}`} delay={0.15} />
          <Kpi label="Tipos IA que USIL no tiene" value={brechas.length} sub={`de ${gs.length} tipos en el mercado`} delay={0.2} />
        </div>

        {/* 1 */}
        <SectionTitle id="p1" n="1">Quién tiene más IA y a qué precio</SectionTitle>
        <div className="grid lg:grid-cols-[3fr_2fr] gap-4 mb-4">
          <Reveal><Panel title="Prevalencia de IA en el catálogo">
            <Legend items={[[C.usil, 'USIL con IA'], [C.comp, 'Competidor con IA'], [C.compT, 'Sin IA']]} />
            <Prevalence data={unis} />
          </Panel></Reveal>
          <Reveal delay={0.1}><Panel title="Precio por hora de un curso IA" caption="Solo cursos IA con horas publicadas. Continental no publica horas.">
            <Legend items={[[C.usil, 'USIL'], [C.comp, 'Competidores']]} />
            <PerHour data={unis} />
          </Panel></Reveal>
        </div>
        <Reveal minH={420} className="mb-14"><Panel title="Distribución de precios de lista" caption="Cada punto es un programa. Barra corta = mediana. UPC, PUCP, UTEC y Continental no publican precio en sus cursos sin IA.">
          <Legend items={[[C.usil, 'USIL con IA'], [C.usilT, 'USIL sin IA'], [C.comp, 'Competidor con IA'], [C.compT, 'Competidor sin IA']]} />
          <Jitter points={points} unis={unis} />
        </Panel></Reveal>

        {/* 2 */}
        <SectionTitle id="p2" n="2">Dónde está USIL en el mapa</SectionTitle>
        <Reveal minH={500} className="mb-14"><Panel title="Mapa competitivo"
          aside={<Segmented value={view} onChange={setView} options={['A', 'B']} small />}
          caption={view === 'A' ? 'Precio ≈ posicionamiento de marca: UTEC sostiene el precio más alto del mercado. Tamaño = programas en catálogo.' : `${RANKING_FUENTE}. UTEC no figura en esa edición.`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Legend items={[[C.usil, 'USIL'], [C.comp, 'Competidor'], [C.accentSoft, 'Cuadrante ideal']]} />
            <span className="text-xs text-ink2 mb-2">{view === 'A' ? 'A · eje x: % del catálogo con IA · eje y: precio promedio curso IA (≈ posicionamiento), escala log' : 'B · eje x: puesto QS Latinoamérica 2026, mejor a la derecha · eje y: % del catálogo con IA'}</span>
          </div>
          <Mapa view={view} unis={unis} mkt={mkt} />
        </Panel></Reveal>
        <div className="grid lg:grid-cols-2 gap-4 mb-14">
          <Reveal minH={340}><Panel title="Cursos con IA por formato" caption="Izquierda: cursos cortos con IA. Derecha: especializaciones y diplomados con IA. Catálogo completo.">
            <Legend items={[[C.usil, 'USIL · cortos'], [C.gold, 'USIL · programas largos'], [C.comp, 'Competidor']]} />
            <Butterfly data={fmts} />
          </Panel></Reveal>
          <Reveal minH={340} delay={0.1}><Panel title="Cuota de USIL por línea: catálogo frente a IA" caption="Líneas con 5+ cursos IA en el mercado. Dorado = USIL lidera el catálogo de la línea y pierde 10+ puntos en IA.">
            <Legend items={[[C.comp, 'Cuota del catálogo'], [C.usil, 'Cuota de los cursos IA']]} />
            <Dumbbell data={cuota.ls} tot={cuota.tot} />
          </Panel></Reveal>
        </div>

        {/* 3 */}
        <SectionTitle id="p3" n="3">Cuánto sube el precio cuando el curso incorpora IA</SectionTitle>
        <div className="grid lg:grid-cols-[2fr_3fr] gap-4 mb-14">
          <Reveal><Panel title="Por universidad" caption={`Promedio ponderado de las líneas comparables de la derecha; se publica con ${MIN_IA}+ cursos IA comparados.`}>
            <Legend items={[[C.usil, 'La IA cuesta más'], [C.usilT, 'La IA cuesta menos'], ['hatch', 'Sin dato comparable']]} />
            <Premium data={premUni} />
          </Panel></Reveal>
          <Reveal delay={0.1}><Panel title="Precio del curso IA por línea: USIL frente a competidores" caption="Medianas por línea y tipo, escala logarítmica. Etiqueta = USIL con IA frente a competidores con IA; dorado = 50%+ por debajo.">
            <Legend items={[[C.usilT, 'USIL sin IA'], [C.usil, 'USIL con IA'], [C.comp, 'Competidores con IA']]} />
            <PriceLadder data={ladder} />
          </Panel></Reveal>
        </div>

        {/* 4 */}
        <SectionTitle id="p4" n="4">Dónde hay oferta y dónde falta</SectionTitle>
        <Reveal minH={600} className="mb-14"><Panel title="Cursos con IA por línea de carrera y universidad" aside={<Segmented value={heatMode} onChange={setHeatMode} options={['n', 'p']} small />} caption={heatMode === 'n' ? 'n · cantidad de cursos IA. Cuanto más oscura la celda, más oferta.' : 'p · precio promedio de los cursos IA de esa línea.'}>
          <Heat rows={heatRows} mode={heatMode} totals={unis} />
        </Panel></Reveal>

        {/* 5 */}
        <SectionTitle id="p5" n="5">Lo que otros venden con IA y USIL no</SectionTitle>
        <Reveal minH={400} className="mb-14"><Panel title="Tipos de curso con IA en el mercado"
          aside={<Segmented value={soloBrechas} onChange={setSoloBrechas} options={['Todos', 'USIL no tiene']} small />}
          caption="Prev. = % de los 5 competidores con al menos un curso de ese tipo. Clic en una fila para ver los cursos.">
          <GroupTable data={soloBrechas === 'Todos' ? gs : brechas} />
        </Panel></Reveal>

        {/* 6 */}
        <SectionTitle id="p6" n="6">Cinco acciones</SectionTitle>
        <div className="grid lg:grid-cols-[2fr_3fr] gap-4 mb-4">
          <Reveal minH={320}><Panel title="Priorización" caption="Zona dorada = empezar aquí. Color = riesgo de implementación.">
            <Legend items={[[RISK[1], 'Riesgo bajo'], [RISK[2], 'Riesgo medio'], [RISK[3], 'Riesgo alto']]} />
            <ActionMatrix actions={ACCIONES} />
          </Panel></Reveal>
          <Reveal minH={320} delay={0.1}><Panel title="Variables de negocio">
            <div className="flex flex-col divide-y divide-line">
              {VARIABLES.map(v => {
                const hits = ACCIONES.map((a, i) => a.variables.includes(v.name) ? i + 1 : null).filter(Boolean)
                return (
                  <div key={v.name} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2 items-center cursor-help" title={`${v.definition}\n\nKPI: ${v.kpi}`}>
                    <div className="min-w-0"><div className="text-[13px] font-semibold text-usil-deep">{v.name}</div><div className="text-xs text-muted truncate">{v.kpi.split(/(?<=\.)\s/)[0]}</div></div>
                    <div className="flex gap-1">{hits.map(n => <span key={n} className="w-6 h-6 rounded-full grid place-items-center text-[11px] font-semibold bg-usil-wash text-usil-deep">{n}</span>)}</div>
                  </div>
                )
              })}
            </div>
          </Panel></Reveal>
        </div>
        <div className="flex flex-col gap-3 mb-12">
          {ACCIONES.map((a, i) => <Reveal key={a.title} minH={120} delay={i * 0.06}><ActionRow a={a} i={i} /></Reveal>)}
        </div>

        <footer className="text-xs text-muted pb-8">Catálogos públicos al {FECHA} · posgrado excluido · precio de lista público general · {RANKING_FUENTE}</footer>
      </main>
    </div>
  )
}
