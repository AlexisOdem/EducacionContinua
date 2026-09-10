import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ALL, TIPOS, S, filt, byUni, mercado, premiumByUni, premiumByLinea, prevTipo, cortosLargos, heat, gaps, pricePoints, FECHA, RANKING_FUENTE } from './stats'
import { Reveal, Segmented, Legend, Prevalence, PerHour, Jitter, Mapa, PrevTipo, Premium, PremiumLinea, Heat, C } from './charts'

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
  <div id={id} className="scroll-mt-20 flex items-baseline gap-4 mb-5">
    <span className="font-display text-4xl leading-none text-usil-tint">{n}</span>
    <h2 className="text-[26px] leading-tight m-0">{children}</h2>
  </div>
)
const Kpi = ({ label, value, sub, delay = 0 }) => (
  <motion.div className="bg-surface rounded-lg border border-line px-4 py-3 min-w-0" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}>
    <div className="text-xs text-muted truncate">{label}</div>
    <div className="num text-[34px] leading-tight text-usil-deep">{value}</div>
    <div className="text-xs text-ink2 truncate">{sub}</div>
  </motion.div>
)

function useActiveSection() {
  const [active, setActive] = useState('p1')
  useEffect(() => {
    const obs = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-30% 0px -60% 0px' })
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); el && obs.observe(el) })
    return () => obs.disconnect()
  }, [])
  return active
}

export default function App() {
  const q = new URLSearchParams(location.search)  // ?tipo=Diplomado&view=B para enlaces directos y capturas
  const [tipo, setTipo] = useState(TIPO_OPTS.includes(q.get('tipo')) ? q.get('tipo') : 'Todos')
  const [view, setView] = useState(q.get('view') === 'B' ? 'B' : 'A')
  const [tipoPrev, setTipoPrev] = useState('Curso corto')
  const [tipoPrem, setTipoPrem] = useState('Todos')
  const [heatMode, setHeatMode] = useState('n')
  const active = useActiveSection()

  const rows = useMemo(() => filt(tipo), [tipo])
  const unis = useMemo(() => byUni(rows), [rows])
  const mkt = useMemo(() => {
    const m = mercado(rows), c = ALL.filter(r => r.t === 'Curso corto'), l = ALL.filter(r => r.t !== 'Curso corto')
    return { ...m, pctC: +(100 * c.filter(r => r.ia).length / c.length).toFixed(1), pctL: +(100 * l.filter(r => r.ia).length / l.length).toFixed(1) }
  }, [rows])
  const usil = unis.find(u => u.u === 'USIL')
  const rankPrev = [...unis].filter(u => u.pct != null).sort((a, b) => b.pct - a.pct).findIndex(u => u.u === 'USIL') + 1
  const points = useMemo(() => pricePoints(rows), [rows])
  const cl = useMemo(() => cortosLargos(), [])
  const heatRows = useMemo(() => heat(rows), [rows])
  const gapList = useMemo(() => gaps(rows), [rows])
  const premUni = useMemo(() => premiumByUni(tipoPrem), [tipoPrem])
  const premLinea = useMemo(() => premiumByLinea(tipoPrem), [tipoPrem])
  const prev = useMemo(() => prevTipo(tipoPrev), [tipoPrev])
  const nGaps = gapList.reduce((a, g) => a + g.rs.length, 0)

  return (
    <div className="lg:grid lg:grid-cols-[240px_1fr] min-h-dvh">
      {/* Barra lateral: marca, navegación por secciones y filtro global */}
      <aside className="lg:sticky lg:top-0 lg:h-dvh bg-usil-deep text-white px-5 py-5 flex flex-col gap-5">
        <div>
          <div className="font-semibold leading-tight">USIL · Educación Continua</div>
          <div className="text-xs text-white/60 mt-1">Benchmark IA · {FECHA}</div>
        </div>
        <nav className="hidden lg:block" aria-label="Secciones">
          {SECTIONS.map(([id, t], i) => (
            <a key={id} href={`#${id}`} className={`flex items-baseline gap-3 py-2 text-[13px] no-underline border-l-2 pl-3 -ml-px transition-colors duration-150 ${active === id ? 'border-gold text-white' : 'border-transparent text-white/60 hover:text-white'}`}>
              <span className="font-display text-base w-4">{i + 1}</span><span>{t}</span>
            </a>
          ))}
        </nav>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-white/50 mb-2">Tipo de curso</div>
          <div className="flex flex-wrap gap-1.5">
            {TIPO_OPTS.map(o => <button key={o} onClick={() => setTipo(o)} aria-pressed={tipo === o} className={`px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors duration-150 ${tipo === o ? 'bg-gold text-usil-deep font-semibold' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}>{o}</button>)}
          </div>
        </div>
      </aside>

      <main className="px-5 lg:px-10 py-8 max-w-[1180px] w-full min-w-0 overflow-x-hidden">
        <motion.h1 className="text-[34px] lg:text-[40px] leading-[1.1] text-usil-deep m-0 mb-1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>IA en la educación continua: USIL frente al mercado</motion.h1>
        <p className="text-xs text-muted m-0 mb-6">USIL · UPC · PUCP · ULima · UTEC · Continental{tipo !== 'Todos' ? ` · filtro: ${tipo}` : ''}</p>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-10">
          <Kpi label="Cursos con IA en el mercado" value={mkt.ia} sub={`de ${mkt.total} programas · ${mkt.pct}%`} />
          <Kpi label="Prevalencia USIL" value={`${usil.pct ?? 0}%`} sub={`${usil.ia} de ${usil.total} · ${rankPrev ? rankPrev + '° de 6' : 's/d'}`} delay={0.05} />
          <Kpi label="Precio curso IA USIL" value={S(usil.avgIA)} sub={`mediana mercado ${S(mkt.medIA)}`} delay={0.1} />
          <Kpi label="Precio por hora USIL" value={usil.ph ? `S/ ${usil.ph}` : 's/d'} sub={`UPC S/ ${unis.find(u => u.u === 'UPC').ph ?? 's/d'} · PUCP S/ ${unis.find(u => u.u === 'PUCP').ph ?? 's/d'}`} delay={0.15} />
          <Kpi label="Cursos IA que USIL no tiene" value={nGaps} sub={`en ${gapList.length} temas o líneas`} delay={0.2} />
        </div>

        {/* 1 */}
        <Reveal minH={60}><SectionTitle id="p1" n="1">Quién tiene más IA y a qué precio</SectionTitle></Reveal>
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
        <Reveal minH={420} className="mb-14 min-w-0"><Panel title="Distribución de precios de lista" caption="Cada punto es un programa. Barra corta = mediana. UPC, PUCP, UTEC y Continental no publican precio en sus cursos sin IA.">
          <Legend items={[[C.usil, 'USIL con IA'], [C.usilT, 'USIL sin IA'], [C.comp, 'Competidor con IA'], [C.compT, 'Competidor sin IA']]} />
          <Jitter points={points} unis={unis} />
        </Panel></Reveal>

        {/* 2 */}
        <Reveal minH={60}><SectionTitle id="p2" n="2">Dónde está USIL en el mapa</SectionTitle></Reveal>
        <Reveal minH={500} className="mb-4"><Panel title="Mapa competitivo"
          aside={<Segmented value={view} onChange={setView} options={['A', 'B']} small />}
          caption={view === 'A' ? 'Precio ≈ posicionamiento de marca: UTEC sostiene el precio más alto del mercado. Tamaño = programas en catálogo.' : `${RANKING_FUENTE}. UTEC no figura en esa edición.`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Legend items={[[C.usil, 'USIL'], [C.comp, 'Competidor'], [C.accentSoft, 'Cuadrante ideal']]} />
            <span className="text-xs text-ink2 mb-2">{view === 'A' ? 'A · eje x: % del catálogo con IA · eje y: precio promedio curso IA (≈ posicionamiento), escala log' : 'B · eje x: puesto QS Latinoamérica 2026, mejor a la derecha · eje y: % del catálogo con IA'}</span>
          </div>
          <Mapa view={view} unis={unis} mkt={mkt} cl={cl} />
        </Panel></Reveal>
        <div className="grid lg:grid-cols-[2fr_3fr] gap-4 mb-14">
          <Reveal minH={340}><Panel title="Prevalencia de IA por tipo de curso" aside={<Segmented value={tipoPrev} onChange={setTipoPrev} options={TIPOS} small />}>
            <Legend items={[[C.usil, 'USIL con IA'], [C.comp, 'Competidor con IA'], [C.compT, 'Sin IA']]} />
            <PrevTipo data={prev} />
          </Panel></Reveal>
          <Reveal minH={340} delay={0.1}><Panel title="Cursos cortos frente a programas largos: % con IA" caption="eje x: % de cursos cortos con IA · eje y: % de especializaciones y diplomados con IA. Diplomados solo existen en USIL y PUCP.">
            <Legend items={[[C.usil, 'USIL'], [C.comp, 'Competidor'], [C.accentSoft, 'Cuadrante ideal']]} />
            <Mapa view="C" unis={unis} mkt={mkt} cl={cl} h={320} />
          </Panel></Reveal>
        </div>

        {/* 3 */}
        <Reveal minH={60}><SectionTitle id="p3" n="3">Cuánto sube el precio cuando el curso incorpora IA</SectionTitle></Reveal>
        <Reveal minH={40}><div className="mb-4"><Segmented value={tipoPrem} onChange={setTipoPrem} options={TIPO_OPTS} /></div></Reveal>
        <div className="grid lg:grid-cols-[2fr_3fr] gap-4 mb-14">
          <Reveal><Panel title="Por universidad" caption="Variación del precio promedio con IA sobre el promedio sin IA, escala 0-100. Rayado = la universidad no publica precio en sus cursos sin IA (solo USIL y ULima lo hacen).">
            <Legend items={[[C.usil, 'USIL'], [C.comp, 'Competidor'], ['hatch', 'Sin precio publicado']]} />
            <Premium data={premUni} />
          </Panel></Reveal>
          <Reveal delay={0.1}><Panel title="Por línea de carrera en USIL" caption="Solo líneas con cursos con y sin IA. Tinte claro = la IA cuesta menos.">
            {premLinea.length ? <PremiumLinea data={premLinea} /> : <div className="h-[320px] flex items-center justify-center text-muted text-sm">Sin líneas comparables para {tipoPrem.toLowerCase()}</div>}
          </Panel></Reveal>
        </div>

        {/* 4 */}
        <Reveal minH={60}><SectionTitle id="p4" n="4">Dónde hay oferta y dónde falta</SectionTitle></Reveal>
        <Reveal minH={600} className="mb-14"><Panel title="Cursos con IA por línea de carrera y universidad" aside={<Segmented value={heatMode} onChange={setHeatMode} options={['n', 'p']} small />} caption={heatMode === 'n' ? 'n · cantidad de cursos IA. Cuanto más oscura la celda, más oferta.' : 'p · precio promedio de los cursos IA de esa línea.'}>
          <Heat rows={heatRows} mode={heatMode} totals={unis} />
        </Panel></Reveal>

        {/* 5 */}
        <Reveal minH={60}><SectionTitle id="p5" n="5">Lo que otros venden con IA y USIL no</SectionTitle></Reveal>
        <Reveal minH={400} className="mb-14"><Panel title={`${nGaps} cursos en ${gapList.length} temas sin equivalente en USIL`} caption="Tema o línea de carrera donde USIL no tiene ningún curso con IA.">
          <div className="grid md:grid-cols-2 gap-x-8">
            {gapList.map(g => (
              <div key={g.why} className="mb-5">
                <div className="text-[13px] font-semibold text-usil-deep border-b border-line pb-1 mb-1.5">{g.why} <span className="text-muted font-normal">· {g.rs.length}</span></div>
                {g.rs.map(r => (
                  <div key={r.url} className="grid grid-cols-[76px_1fr_64px] gap-2 text-[13px] py-1 items-baseline hover:bg-usil-wash rounded transition-colors duration-150">
                    <span className="text-ink2 pl-1">{r.u}</span>
                    <a href={r.url} target="_blank" rel="noopener" className="text-ink hover:text-usil no-underline leading-snug">{r.n}</a>
                    <span className="text-right text-ink2 tabular-nums pr-1">{r.p ? S(r.p) : 's/d'}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Panel></Reveal>

        {/* 6 */}
        <Reveal minH={60}><SectionTitle id="p6" n="6">Cinco acciones</SectionTitle></Reveal>
        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4 mb-12">
          {[
            ['Lanzar IA en Salud', '20 programas de Salud en USIL, 0 con IA. Continental ya vende 5 a S/ 150-200.'],
            ['Subir el precio en Gestión, Marketing y Datos', 'Mediana de mercado S/ 1,230; USIL cobra S/ 500. Ahí compite de frente con UPC y PUCP.'],
            ['Cubrir ciberseguridad, gestión pública y ética de IA', 'Temas con oferta en UPC, PUCP y UTEC y ningún curso en USIL.'],
            ['Convertir 4 o 5 cursos de Hotelería a "con IA"', 'USIL es la única universidad con IA en Hotelería. 34 programas donde consolidar el nicho.'],
            ['Crear 2 especializaciones con IA', 'UPC tiene 11 y PUCP 7; USIL tiene 1. Es el formato donde el mercado cobra más.'],
          ].map(([t, d], i) => (
            <Reveal key={t} minH={120} delay={i * 0.08}>
              <div className="bg-surface rounded-lg border border-line border-t-[3px] border-t-gold p-4 h-full">
                <div className="font-display text-3xl leading-none text-usil-tint mb-2">{i + 1}</div>
                <h3 className="text-[17px] leading-tight m-0 mb-2">{t}</h3>
                <p className="text-[13px] text-ink2 m-0">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <footer className="text-xs text-muted max-w-[80ch] pb-8">
          Fuente: catálogos públicos de educación continua rastreados el {FECHA}, posgrado excluido. "Con IA" = el programa menciona inteligencia artificial, IA generativa o machine learning. Precio de lista = público general sin pronto pago. Líneas, temas y tipo de curso asignados por palabras clave. Ranking: {RANKING_FUENTE}.
        </footer>
      </main>
    </div>
  )
}
