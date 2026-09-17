import { lazy, memo, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { TIPOS, LINEAS, LINEA_GENERAL, S, filt, byUni, mercado, premiumByUni, escalera, heat, grupos, pricePoints, formatos, cuotaLineas, linea as fichaLinea, FECHA, RANKING_FUENTE, MIN_IA } from './stats'
import { Panel, Kpi } from './ui'
import Ficha from './ficha'
import * as CH from './charts'
const { Reveal, Segmented, Legend, ActionRow, RISK, C } = CH
// Gráficos memorizados: un cambio de estado que no les toca (vista del mapa, modo del mapa de calor, filtro de la tabla) no los vuelve a dibujar.
const [Prevalence, PerHour, Jitter, Mapa, Butterfly, Dumbbell, Premium, PriceLadder, Heat, GroupTable, ActionMatrix] =
  [CH.Prevalence, CH.PerHour, CH.Jitter, CH.Mapa, CH.Butterfly, CH.Dumbbell, CH.Premium, CH.PriceLadder, CH.Heat, CH.GroupTable, CH.ActionMatrix].map(c => memo(c))
import { ACCIONES, VARIABLES } from './acciones'
import META from './segmentos_meta.json'
import logo from './assets/logo-usil-30.png'

/* Tres formas de análisis en la misma app; ?seg= las enlaza. 'ec' es la vista histórica y no cambia.
   Las filas de institutos y posgrado (~930) viajan en un chunk aparte: solo se descargan al elegir el segmento. */
const SegmentView = lazy(() => import('./segmento'))
const SEGS = [['ec', 'Educación continua'], ['institutos', 'Institutos'], ['posgrado', 'Posgrado']]
const TIPOS_DE = { ec: TIPOS, institutos: META.institutos.tipos, posgrado: META.posgrado.tipos }
const opts = seg => ['Todos', ...TIPOS_DE[seg]]

const LINEA_OPTS = [LINEA_GENERAL, ...LINEAS]

/* Ayuda de lectura de cada gráfico (para el icono ⓘ de Panel): tres frases sin jerga ni cifras inventadas. */
const HELP_EC = {
  prevalencia: { que: 'Cada barra es una universidad: la parte llena son sus cursos con IA, el resto sin IA.', como: 'Están ordenadas de mayor a menor cantidad de cursos con IA; el % de la derecha es su prevalencia.', mira: 'Si USIL está entre las primeras y qué tan lejos queda del líder.' },
  porHora: { que: 'El precio promedio por hora de los cursos con IA que sí publican horas, por universidad.', como: 'Barras más largas son más caras por hora; Continental no aparece porque no publica horas.', mira: 'Si USIL cobra más o menos por hora que el resto al vender un curso con IA.' },
  jitter: { que: 'Cada punto es un programa; su altura es el precio de lista.', como: 'Los puntos llenos son cursos con IA y los tenues sin IA; la barra corta marca la mediana de cada grupo.', mira: 'Si los puntos con IA de USIL quedan más arriba que los suyos sin IA, y cómo se comparan con la competencia.' },
  mapaA: { que: 'Cada burbuja es una universidad; a la derecha, más % de catálogo con IA; arriba, mayor precio promedio de sus cursos con IA. El tamaño es su catálogo.', como: 'La zona dorada es donde conviene estar: más IA que el mercado sosteniendo un precio alto.', mira: 'Dónde cae USIL frente a la zona dorada y qué universidad se aleja más del resto.' },
  mapaB: { que: 'Cada burbuja es una universidad; a la derecha, mejor puesto en el ranking QS; arriba, mayor % de catálogo con IA.', como: 'La zona dorada junta buen ranking con alta prevalencia de IA.', mira: 'Si USIL logra estar en la zona dorada o si le falta ranking, IA, o ambos.' },
  butterfly: { que: 'A la izquierda, cursos cortos con IA; a la derecha, especializaciones y diplomados con IA, por universidad.', como: 'Cuanto más larga la barra de un lado, más cursos con IA tiene esa universidad en ese formato.', mira: 'Si USIL concentra su IA en un solo formato y en cuál formato lidera la competencia.' },
  dumbbell: { que: 'Por cada línea de carrera, dos puntos: la cuota de catálogo de USIL (gris) y su cuota de los cursos con IA (azul).', como: 'Si el punto azul queda muy por detrás del gris, USIL vende más catálogo del que vende en IA en esa línea.', mira: 'Las líneas doradas: ahí USIL lidera el catálogo pero pierde terreno en IA.' },
  premium: { que: 'Cuánto más cara resulta, en promedio, la versión con IA de un curso frente a la misma línea sin IA.', como: 'Barra hacia la derecha (azul) es que la IA sube el precio; hacia la izquierda, que lo baja. Rayado = sin datos suficientes.', mira: 'Si USIL cobra una prima por IA y cómo se compara con el resto.' },
  ladder: { que: 'Por línea de carrera, tres precios: USIL sin IA, USIL con IA y la competencia con IA.', como: 'La barra conecta el precio más bajo con el más alto de los tres; dorado si USIL queda 50% o más por debajo del mercado.', mira: 'Las líneas doradas: ahí USIL vende su curso con IA muy por debajo de lo que cobra la competencia.' },
  heat: { que: 'Una tabla: las filas son líneas de carrera, las columnas universidades; cada celda es su número de cursos con IA.', como: 'Cuanto más oscura la celda, más oferta de IA tiene esa universidad en esa línea.', mira: 'Las filas donde USIL tiene celdas claras o vacías mientras la competencia tiene celdas oscuras.' },
  grupos: { que: 'Cada fila es un tema de curso con IA (por ejemplo, marketing con IA); los puntos muestran qué competidores lo venden.', como: 'El círculo o la equis de la derecha dicen si USIL tiene ese tipo de curso; clic en la fila despliega los cursos.', mira: 'Las filas con la equis y varios competidores marcados: son temas que el mercado ya vende y USIL no.' },
  matriz: { que: 'Cada burbuja numerada es una de las acciones propuestas, ubicada según su oportunidad y su dificultad.', como: 'Arriba a la izquierda (zona dorada) están las acciones de mayor impacto y más fáciles de ejecutar; el color de la burbuja es su riesgo.', mira: 'Qué acciones caen en la zona dorada: por ahí conviene empezar.' },
  variables: { que: 'Las variables de negocio que resume el análisis, con un círculo numerado por cada acción que las mueve.', como: 'Pasa el mouse o el teclado sobre una variable para ver su definición completa y el indicador que la mide.', mira: 'Qué variable concentra más acciones: es la que más se mueve si se ejecuta la lista completa.' },
  kpiMercado: { que: 'Cuántos de los 905 programas del mercado (USIL y sus 5 competidores) ya incorporan IA.', como: 'Es el tamaño del fenómeno: qué tan extendida está la IA en el catálogo de educación continua.', mira: 'Si el % de mercado sigue creciendo respecto a la última medición, antes de mirar cómo le va a USIL en particular.' },
  kpiPrevalencia: { que: 'Qué porcentaje del catálogo de USIL ya tiene IA, y en qué puesto queda frente a los otros 5.', como: 'El puesto cuenta solo universidades con catálogo bajo el filtro activo; 1° es el mejor de 6.', mira: 'Si USIL está entre las primeras dos o se está quedando atrás del resto.' },
  kpiPrecio: { que: 'El precio promedio del curso con IA de USIL, frente a la mediana del mercado.', como: 'Si el precio de USIL supera la mediana del mercado, está cobrando una prima por sus cursos IA; si es menor, la está regalando.', mira: 'La brecha entre ambas cifras: define si hay espacio para subir precio sin perder competitividad.' },
  kpiPorHora: { que: 'Cuánto cobra USIL por cada hora de un curso con IA, comparado con dos competidores de referencia.', como: 'Compara las tres cifras: más alto es más caro por hora de contenido.', mira: 'Si USIL cobra por hora en línea con el mercado o se aleja mucho hacia arriba o hacia abajo.' },
  kpiBrechas: { que: 'Cuántos tipos de curso con IA vende el mercado que USIL todavía no tiene en su catálogo.', como: 'Cada tipo viene de agrupar cursos IA por tema; el total de la derecha es cuántos tipos existen en el mercado.', mira: 'Si el número es alto, hay varias oportunidades de catálogo sin explorar todavía.' },
}

const SectionTitle = ({ id, n, children }) => (
  <motion.div id={id} className="scroll-mt-20 flex items-baseline gap-4 mb-5" initial={CH.ANIM ? { opacity: 0, x: -24 } : false} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
    <span className="font-display text-4xl leading-none text-usil-tint">{n}</span>
    <h2 className="text-[26px] leading-tight m-0">{children}</h2>
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

export default function App() {
  const q = new URLSearchParams(location.search)  // ?seg=institutos&tipo=Curso%20corto&view=B&linea=Salud para enlaces directos y capturas
  const seg0 = SEGS.some(([k]) => k === q.get('seg')) ? q.get('seg') : 'ec'
  const [seg, setSeg] = useState(seg0)
  const [tipo, setTipo] = useState(opts(seg0).includes(q.get('tipo')) ? q.get('tipo') : 'Todos')
  const [view, setView] = useState(q.get('view') === 'B' ? 'B' : 'A')
  const [lin, setLin] = useState(LINEA_OPTS.includes(q.get('linea')) ? q.get('linea') : LINEA_GENERAL)
  const [heatMode, setHeatMode] = useState('n')
  const [soloBrechas, setSoloBrechas] = useState('Todos')
  const TIPO_OPTS = opts(seg)
  const meta = META[seg]

  // el segmento y la línea activos viven en la URL para que el enlace sea compartible
  useEffect(() => {
    document.title = seg === 'ec' ? 'IA en educación continua: USIL frente al mercado'
      : `IA en ${seg === 'posgrado' ? 'el posgrado' : 'los institutos'}: ${META[seg].benchmark_largo} frente al mercado`
    const p = new URLSearchParams(location.search)
    if (seg === 'ec') p.delete('seg'); else p.set('seg', seg)
    if (lin === LINEA_GENERAL || seg !== 'ec') p.delete('linea'); else p.set('linea', lin)
    if (p.get('tipo') !== tipo) p.delete('tipo')  // al cambiar de segmento el filtro vuelve a Todos: el ?tipo= del enlace anterior queda obsoleto
    const s = p.toString()
    history.replaceState(null, '', `${location.pathname}${s ? `?${s}` : ''}${location.hash}`)
  }, [seg, lin])

  const cambiarSeg = s => { setSeg(s); setTipo('Todos'); setLin(LINEA_GENERAL); scrollTo({ top: 0 }) }

  // en un segmento nuevo no se calcula nada de educación continua (los hooks no pueden ser condicionales)
  const ec = seg === 'ec'
  const rows = useMemo(() => ec ? filt(tipo) : [], [ec, tipo])
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
  const premUni = useMemo(() => ec ? premiumByUni(tipo) : [], [ec, tipo])
  const ladder = useMemo(() => escalera(rows), [rows])
  const ficha = useMemo(() => lin === LINEA_GENERAL ? null : fichaLinea(rows, lin), [rows, lin])

  return (
    <div className="lg:grid lg:grid-cols-[240px_1fr] min-h-dvh">
      {/* Barra lateral: marca, navegación por secciones y filtro global */}
      <aside className="relative lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto bg-usil-deep text-white px-5 py-5 flex flex-col gap-5">
        <ProgressBar />
        <div>
          <div className="bg-white rounded-lg px-4 py-3 max-w-[200px]"><img src={logo} alt="USIL, 30 años. Tu puente al mundo" className="block w-full h-auto" /></div>
          <div className="font-semibold leading-tight mt-4">{ec ? 'Educación Continua' : meta.benchmark_largo}</div>
          <div className="text-xs text-white/60 mt-1">Benchmark IA · {ec ? FECHA : meta.fecha}</div>
        </div>
        {/* Selector de segmento: tres formas de análisis sobre la misma app */}
        <div>
          <div className="text-[11px] uppercase tracking-wide text-white/50 mb-2">Segmento</div>
          <div className="flex flex-col gap-1">
            {SEGS.map(([k, t]) => <button key={k} onClick={() => cambiarSeg(k)} aria-pressed={seg === k} className={`text-left px-2.5 py-1.5 rounded text-[13px] cursor-pointer transition-colors duration-150 ${seg === k ? 'bg-white text-usil-deep font-semibold' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}>{t}</button>)}
          </div>
        </div>
        {ficha && <div>
          <div className="text-[13px] font-semibold leading-snug">{lin}</div>
          <button onClick={() => setLin(LINEA_GENERAL)} className="mt-2 p-0 bg-transparent border-0 text-[13px] text-white/70 hover:text-white underline cursor-pointer">← Volver a General</button>
        </div>}
        <div>
          <div className="text-[11px] uppercase tracking-wide text-white/50 mb-2">{ec || seg === 'institutos' ? 'Tipo de curso' : 'Nivel'}</div>
          <div className="grid grid-cols-2 gap-1.5">
            {TIPO_OPTS.map(o => <button key={o} onClick={() => setTipo(o)} aria-pressed={tipo === o} className={`px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors duration-150 leading-snug ${tipo === o ? 'bg-gold text-usil-deep font-semibold' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}>{o}</button>)}
          </div>
        </div>
        {ec && <div>
          <label htmlFor="linea" className="block text-[11px] uppercase tracking-wide text-white/50 mb-2">Línea de carrera</label>
          <select id="linea" value={lin} onChange={e => setLin(e.target.value)}
            className={`w-full rounded border-0 px-2 py-1.5 text-xs cursor-pointer ${ficha ? 'bg-gold text-usil-deep font-semibold' : 'bg-white/10 text-white'}`}>
            {LINEA_OPTS.map(o => <option key={o} value={o} className="bg-white text-ink font-normal">{o}</option>)}
          </select>
        </div>}
      </aside>

      <main className="px-5 lg:px-10 py-8 max-w-[1180px] w-full min-w-0 overflow-x-clip">
        {!ec ? <Suspense fallback={<div className="h-dvh" />}><SegmentView key={seg} seg={seg} tipo={tipo} /></Suspense>
          : ficha ? <Ficha key={lin} d={ficha} tipo={tipo} /> : <>
        <motion.h1 className="text-[34px] lg:text-[40px] leading-[1.1] text-usil-deep m-0 mb-1" initial={CH.ANIM ? { opacity: 0, y: 12 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: CH.ANIM ? 0.6 : 0 }}>IA en la educación continua: USIL frente al mercado</motion.h1>
        <p className="text-xs text-muted m-0 mb-6">USIL · UPC · PUCP · ULima · UTEC · Continental{tipo !== 'Todos' ? ` · filtro: ${tipo}` : ''}</p>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-10">
          <Kpi label="Cursos con IA en el mercado" value={mkt.ia} sub={`de ${mkt.total} programas · ${mkt.pct}%`} help={HELP_EC.kpiMercado} />
          <Kpi label="Prevalencia USIL" value={usil.pct ?? 0} format={v => `${v.toFixed(1)}%`} sub={`${usil.ia} de ${usil.total} · ${rankPrev ? rankPrev + '° de 6' : 's/d'}`} delay={0.05} help={HELP_EC.kpiPrevalencia} />
          <Kpi label="Precio curso IA USIL" value={usil.avgIA} format={S} sub={`mediana mercado ${S(mkt.medIA)}`} delay={0.1} help={HELP_EC.kpiPrecio} />
          <Kpi label="Precio por hora USIL" value={usil.ph ?? null} format={v => `S/ ${Math.round(v)}`} sub={`UPC S/ ${unis.find(u => u.u === 'UPC').ph ?? 's/d'} · PUCP S/ ${unis.find(u => u.u === 'PUCP').ph ?? 's/d'}`} delay={0.15} help={HELP_EC.kpiPorHora} />
          <Kpi label="Tipos IA que USIL no tiene" value={brechas.length} sub={`de ${gs.length} tipos en el mercado`} delay={0.2} help={HELP_EC.kpiBrechas} />
        </div>

        {/* 1 */}
        <SectionTitle id="p1" n="1">Quién tiene más IA y a qué precio</SectionTitle>
        <div className="grid lg:grid-cols-[3fr_2fr] gap-4 mb-4">
          <Reveal><Panel title="Prevalencia de IA en el catálogo" help={HELP_EC.prevalencia}>
            <Legend items={[[C.usil, 'USIL con IA'], [C.comp, 'Competidor con IA'], [C.compT, 'Sin IA']]} />
            <Prevalence data={unis} />
          </Panel></Reveal>
          <Reveal delay={0.1}><Panel title="Precio por hora de un curso IA" caption="Solo cursos IA con horas publicadas. Continental no publica horas." help={HELP_EC.porHora}>
            <Legend items={[[C.usil, 'USIL'], [C.comp, 'Competidores']]} />
            <PerHour data={unis} />
          </Panel></Reveal>
        </div>
        <Reveal minH={420} className="mb-14"><Panel title="Distribución de precios de lista" caption="Cada punto es un programa. Barra corta = mediana. UPC, PUCP, UTEC y Continental no publican precio en sus cursos sin IA." help={HELP_EC.jitter}>
          <Legend items={[[C.usil, 'USIL con IA'], [C.usilT, 'USIL sin IA'], [C.comp, 'Competidor con IA'], [C.compT, 'Competidor sin IA']]} />
          <Jitter points={points} unis={unis} />
        </Panel></Reveal>

        {/* 2 */}
        <SectionTitle id="p2" n="2">Dónde está USIL en el mapa</SectionTitle>
        <Reveal minH={500} className="mb-14"><Panel title="Mapa competitivo"
          aside={<Segmented value={view} onChange={setView} options={['A', 'B']} small />}
          caption={view === 'A' ? 'Precio ≈ posicionamiento de marca: UTEC sostiene el precio más alto del mercado. Tamaño = programas en catálogo.' : `${RANKING_FUENTE}. UTEC no figura en esa edición.`}
          help={view === 'A' ? HELP_EC.mapaA : HELP_EC.mapaB}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Legend items={[[C.usil, 'USIL'], [C.comp, 'Competidor'], [C.accentSoft, 'Cuadrante ideal']]} />
            <span className="text-xs text-ink2 mb-2">{view === 'A' ? 'A · eje x: % del catálogo con IA · eje y: precio promedio curso IA (≈ posicionamiento), escala log' : 'B · eje x: puesto QS Latinoamérica 2026, mejor a la derecha · eje y: % del catálogo con IA'}</span>
          </div>
          <Mapa view={view} unis={unis} mkt={mkt} />
        </Panel></Reveal>
        <div className="grid lg:grid-cols-2 gap-4 mb-14">
          <Reveal minH={340}><Panel title="Cursos con IA por formato" caption="Izquierda: cursos cortos con IA. Derecha: especializaciones y diplomados con IA. Catálogo completo." help={HELP_EC.butterfly}>
            <Legend items={[[C.usil, 'USIL · cortos'], [C.gold, 'USIL · programas largos'], [C.comp, 'Competidor']]} />
            <Butterfly data={fmts} />
          </Panel></Reveal>
          <Reveal minH={340} delay={0.1}><Panel title="Cuota de USIL por línea: catálogo frente a IA" caption="Líneas con 5+ cursos IA en el mercado. Dorado = USIL lidera el catálogo de la línea y pierde 10+ puntos en IA." help={HELP_EC.dumbbell}>
            <Legend items={[[C.comp, 'Cuota del catálogo'], [C.usil, 'Cuota de los cursos IA']]} />
            <Dumbbell data={cuota.ls} tot={cuota.tot} />
          </Panel></Reveal>
        </div>

        {/* 3 */}
        <SectionTitle id="p3" n="3">Cuánto sube el precio cuando el curso incorpora IA</SectionTitle>
        <div className="grid lg:grid-cols-[2fr_3fr] gap-4 mb-14">
          <Reveal><Panel title="Por universidad" caption={`Promedio ponderado de las líneas comparables de la derecha; se publica con ${MIN_IA}+ cursos IA comparados.`} help={HELP_EC.premium}>
            <Legend items={[[C.usil, 'La IA cuesta más'], [C.usilT, 'La IA cuesta menos'], ['hatch', 'Sin dato comparable']]} />
            <Premium data={premUni} />
          </Panel></Reveal>
          <Reveal delay={0.1}><Panel title="Precio del curso IA por línea: USIL frente a competidores" caption="Medianas por línea y tipo, escala logarítmica. Etiqueta = USIL con IA frente a competidores con IA; dorado = 50%+ por debajo." help={HELP_EC.ladder}>
            <Legend items={[[C.usilT, 'USIL sin IA'], [C.usil, 'USIL con IA'], [C.comp, 'Competidores con IA']]} />
            <PriceLadder data={ladder} />
          </Panel></Reveal>
        </div>

        {/* 4 */}
        <SectionTitle id="p4" n="4">Dónde hay oferta y dónde falta</SectionTitle>
        <Reveal minH={600} className="mb-14"><Panel title="Cursos con IA por línea de carrera y universidad" aside={<Segmented value={heatMode} onChange={setHeatMode} options={['n', 'p']} small />} caption={heatMode === 'n' ? 'n · cantidad de cursos IA. Cuanto más oscura la celda, más oferta.' : 'p · precio promedio de los cursos IA de esa línea.'} help={HELP_EC.heat}>
          <Heat rows={heatRows} mode={heatMode} totals={unis} />
        </Panel></Reveal>

        {/* 5 */}
        <SectionTitle id="p5" n="5">Lo que otros venden con IA y USIL no</SectionTitle>
        <Reveal minH={400} className="mb-14"><Panel title="Tipos de curso con IA en el mercado"
          aside={<Segmented value={soloBrechas} onChange={setSoloBrechas} options={['Todos', 'USIL no tiene']} small />}
          caption="Prev. = % de los 5 competidores con al menos un curso de ese tipo. Clic en una fila para ver los cursos." help={HELP_EC.grupos}>
          <GroupTable data={soloBrechas === 'Todos' ? gs : brechas} />
        </Panel></Reveal>

        {/* 6 */}
        <SectionTitle id="p6" n="6">Cinco acciones</SectionTitle>
        <div className="grid lg:grid-cols-[2fr_3fr] gap-4 mb-4">
          <Reveal minH={320}><Panel title="Priorización" caption="Zona dorada = empezar aquí. Color = riesgo de implementación." help={HELP_EC.matriz}>
            <Legend items={[[RISK[1], 'Riesgo bajo'], [RISK[2], 'Riesgo medio'], [RISK[3], 'Riesgo alto']]} />
            <ActionMatrix actions={ACCIONES} />
          </Panel></Reveal>
          <Reveal minH={320} delay={0.1}><Panel title="Variables de negocio" help={HELP_EC.variables}>
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
        </>}
      </main>
    </div>
  )
}
