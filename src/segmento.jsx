import { memo, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { makeStats } from './stats'
import { Panel, Kpi } from './ui'
import DI from './data_institutos.json'
import DP from './data_posgrado.json'
import { ACCIONES as ACC_INST, VARIABLES as VAR_INST } from './acciones_institutos'
import { ACCIONES as ACC_POS, VARIABLES as VAR_POS } from './acciones_posgrado'
import * as CH from './charts'
const { Reveal, Segmented, Legend, ActionRow, RISK, C } = CH
// Gráficos memorizados: cambiar el modo del mapa de calor o el filtro de la tabla no los vuelve a dibujar.
const [Prevalence, StackedNivel, Mapa, Butterfly, Dumbbell, Heat, GroupTable, ActionMatrix, ConstruccionUso, AmplitudGrid, MastersDots, DoctoralDots] =
  [CH.Prevalence, CH.StackedNivel, CH.Mapa, CH.Butterfly, CH.Dumbbell, CH.Heat, CH.GroupTable, CH.ActionMatrix, CH.ConstruccionUso, CH.AmplitudGrid, CH.MastersDots, CH.DoctoralDots].map(c => memo(c))

/* Las filas de los dos segmentos y sus acciones viven en este módulo, que App.jsx carga con lazy():
   educación continua no paga su peso (unas 930 filas más) al abrir la página. */
const DATOS = {
  institutos: { ds: makeStats(DI), acciones: ACC_INST, variables: VAR_INST },
  posgrado: { ds: makeStats(DP), acciones: ACC_POS, variables: VAR_POS },
}

const SectionTitle = ({ id, n, children }) => (
  <motion.div id={id} className="scroll-mt-20 flex items-baseline gap-4 mb-5" initial={CH.ANIM ? { opacity: 0, x: -24 } : false} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
    <span className="font-display text-4xl leading-none text-usil-tint">{n}</span>
    <h2 className="text-[26px] leading-tight m-0">{children}</h2>
  </motion.div>
)

/* Leyenda de la rampa de niveles: un cuadrito por tipo con el color que usa StackedNivel. */
const LegendNivel = ({ tipos }) => <Legend items={tipos.map((t, i) => [CH.rampa('Competidor', i), t])} />

/* Ayuda de lectura de cada gráfico (icono ⓘ de Panel), común a Institutos y Posgrado.
   nv = 'nivel' en posgrado, 'formato' en institutos; b = nombre corto del benchmark (USIL IE / USIL EPG). */
const helpDe = (b, nv, esPos) => ({
  prevalencia: { que: 'Cada barra es una institución: la parte llena son sus programas con IA, el resto sin IA.', como: 'Están ordenadas de mayor a menor cantidad de programas con IA; el % de la derecha es su prevalencia.', mira: `Si ${b} está entre las primeras y qué tan lejos queda del líder.` },
  nivel: { que: `El catálogo completo de cada institución, repartido por ${nv}.`, como: 'Cada color es un nivel distinto; el número junto al nombre es el total de programas de esa institución.', mira: `En qué ${nv} concentra su catálogo ${b} y si se parece al de la competencia.` },
  mapa: { que: 'Cada burbuja es una institución; a la derecha, catálogo más grande; arriba, mayor porcentaje de cursos con IA.', como: 'La zona dorada es donde conviene estar: más IA que el mercado con un catálogo grande.', mira: `Dónde cae ${b} frente a la zona dorada y quién está dentro.` },
  dumbbell: { que: `Por cada línea de carrera, dos puntos: la cuota de catálogo de ${b} (gris) y su cuota de los cursos con IA (azul).`, como: 'Si el punto azul queda muy por detrás del gris, la institución vende más catálogo del que vende en IA en esa línea.', mira: 'Las líneas doradas: ahí lidera el catálogo de la línea pero pierde terreno en IA.' },
  butterfly: { que: `A la izquierda, ${esPos ? 'educación ejecutiva' : 'cursos cortos'} con IA; a la derecha, formato largo con IA, por institución.`, como: 'Cuanto más larga la barra de un lado, más programas con IA tiene esa institución en ese formato.', mira: `Si ${b} concentra su IA en un solo formato y en cuál lidera la competencia.` },
  nivelIA: { que: `El reparto, en %, de los programas con IA de cada institución entre los ${esPos ? 'niveles' : 'formatos'} del catálogo.`, como: 'Barras al 100%: el color que domina es el nivel donde esa institución concentra su oferta de IA.', mira: `En qué ${nv} vende IA ${b} y si coincide con dónde lo hace la competencia.` },
  heat: { que: 'Una tabla: las filas son líneas de carrera, las columnas instituciones; cada celda es su número de programas con IA.', como: 'Cuanto más oscura la celda, más oferta de IA tiene esa institución en esa línea.', mira: `Las filas donde ${b} tiene celdas claras o vacías mientras la competencia tiene celdas oscuras.` },
  grupos: { que: 'Cada fila es un tema de curso con IA (por ejemplo, IA para el sector público); los puntos muestran qué competidores lo venden.', como: 'El círculo o la equis de la derecha dicen si la institución tiene ese tipo de programa; clic en la fila despliega los programas.', mira: `Las filas con la equis y varios competidores marcados: son temas que el mercado ya vende y ${b} no.` },
  amplitud: { que: 'Cada fila es una institución con al menos un programa de IA; los 12 cuadros son los temas de IA curados para este segmento.', como: 'Cuadro lleno = tiene un programa en ese tema; están ordenadas de más a menos temas cubiertos, y a la derecha el total de temas y de programas con IA.', mira: `Si ${b} apuesta ancho, repartido en varios temas, o se concentra en uno o dos frente a la competencia.` },
  construccion: { que: 'De los programas con IA de cada institución, cuántos son de construir IA (datos, machine learning, desarrollo de software) y cuántos son de usarla en otra disciplina.', como: 'El tramo oscuro es construcción, el claro es uso; a la derecha, cuántos de construcción tiene sobre el total de sus programas con IA.', mira: `Si ${b} tiene algún programa de construcción o si toda su oferta de IA es para usarla, no para construirla.` },
  maestriasDoc: { que: `A la izquierda, un punto por cada maestría o MBA con IA de cada escuela; a la derecha, un punto por cada doctorado de su catálogo.`, como: 'El punto oscuro es una maestría dedicada a IA o datos, el claro aplica IA en otra disciplina; en doctorados, relleno significa que tiene IA y hueco que no.', mira: `Si ${b} tiene alguna maestría dedicada a IA o algún doctorado con IA, y qué otras escuelas sí la tienen.` },
  matriz: { que: 'Cada burbuja numerada es una de las acciones propuestas, ubicada según su oportunidad y su dificultad.', como: 'Arriba a la izquierda (zona dorada) están las acciones de mayor impacto y más fáciles de ejecutar; el color de la burbuja es su riesgo.', mira: 'Qué acciones caen en la zona dorada: por ahí conviene empezar.' },
  variables: { que: 'Las variables de negocio que resume el análisis, con un círculo numerado por cada acción que las mueve.', como: 'Pasa el mouse o el teclado sobre una variable para ver su definición completa y el indicador que la mide.', mira: 'Qué variable concentra más acciones: es la que más se mueve si se ejecuta la lista completa.' },
  kpiMercado: { que: `Cuántos programas del mercado (${b} y su competencia) ya incorporan IA.`, como: 'Es el tamaño del fenómeno en el segmento antes de mirar cómo le va a cada institución.', mira: 'Si el % de mercado es alto, la IA ya es estándar en el segmento y no una excepción.' },
  kpiPrevalencia: { que: `Qué porcentaje del catálogo de ${b} ya tiene IA, y en qué puesto queda frente a la competencia comparable.`, como: 'El puesto solo cuenta instituciones comparables (mismo tipo de conteo, programa por programa).', mira: `Si ${b} lidera el segmento o se está quedando atrás del resto.` },
  kpiLineas: { que: `En cuántas líneas de carrera distintas ${b} ya vende al menos un programa con IA.`, como: 'Compara ese número con el total de líneas donde la institución tiene catálogo: cuanto más cerca, más repartida está su oferta de IA.', mira: `Si ${b} concentra su IA en una sola línea o la reparte en varias.` },
  kpiBrechas: { que: `Cuántos tipos de programa con IA vende el mercado que ${b} todavía no tiene en su catálogo.`, como: 'Cada tipo viene de agrupar programas IA por tema; el total de la derecha es cuántos tipos existen en el mercado.', mira: 'Si el número es alto, hay varias oportunidades de catálogo sin explorar todavía.' },
  kpi4: esPos
    ? { que: 'Cuántas maestrías y MBA del mercado ya incorporan IA, sobre el total de maestrías y MBA del catálogo.', como: 'Es el nivel de mayor inversión y compromiso del estudiante: la IA ahí pesa más que en un curso corto.', mira: `Cuántos de esos programas son de ${b} frente al resto del mercado.` }
    : { que: 'Cuántos programas de formato largo (programa, diplomado o certificación) con IA vende el mercado, sobre el catálogo largo total.', como: 'El formato largo es donde se concentra el ingreso por alumno; la IA ahí importa más que en un curso corto.', mira: `Cuántos de esos programas son de ${b} frente al resto del mercado.` },
})

export default function SegmentView({ seg, tipo }) {
  const { ds, acciones, variables } = DATOS[seg]
  const { D, UNIS, COMPS, USIL, TIPOS, CORTO, LARGOS, BENCHMARK } = ds
  const esPos = D.seg === 'posgrado'
  const H = useMemo(() => helpDe(BENCHMARK, esPos ? 'nivel' : 'formato', esPos), [BENCHMARK, esPos])
  const [heatMode, setHeatMode] = useState('n')
  const [soloBrechas, setSoloBrechas] = useState('Todos')

  const rows = useMemo(() => ds.filt(tipo), [ds, tipo])
  const unis = useMemo(() => ds.byUni(rows), [ds, rows])
  const mkt = useMemo(() => ds.mercado(rows), [ds, rows])
  const usil = unis.find(u => u.u === USIL)
  const prev = ds.puestoPrev(unis)
  const mapa = useMemo(() => ds.mapaC(rows), [ds, rows])
  const fmts = useMemo(() => ds.formatos(rows), [ds, rows])
  const niveles = useMemo(() => ds.porNivel(rows), [ds, rows])
  const nivelIA = useMemo(() => ds.porNivel(rows, true), [ds, rows])
  const cuota = useMemo(() => ds.cuotaLineas(rows, 3), [ds, rows])
  const heatRows = useMemo(() => ds.heat(rows), [ds, rows])
  const gs = useMemo(() => ds.grupos(rows), [ds, rows])
  const brechas = useMemo(() => gs.filter(g => !g.nUsil && g.k), [gs])
  const amplitud = useMemo(() => ds.amplitud(rows), [ds, rows])
  const construccion = useMemo(() => ds.construccionUso(rows), [ds, rows])
  const maestriasData = useMemo(() => (esPos ? ds.maestrias(rows) : null), [ds, rows, esPos])
  const doctoradosData = useMemo(() => (esPos ? ds.doctorados(rows) : null), [ds, rows, esPos])

  const aggU = UNIS.filter(u => unis.find(x => x.u === u)?.agg)     // instituciones enteras por categoría (rayado del bubble/barra)
  const hayCategorias = rows.some(r => r.agg)                       // hay categorías sueltas aunque ninguna institución sea 100% categoría (p. ej. UPC)
  const catRows = rows.filter(r => r.agg)
  const iaLargo = rows.filter(r => r.ia && LARGOS.includes(r.t))
  const catLargo = rows.filter(r => LARGOS.includes(r.t))
  const mmRows = rows.filter(r => r.t === 'Maestría y MBA'), mmIA = mmRows.filter(r => r.ia)
  const kpi4 = esPos
    ? { label: 'Maestrías y MBA con IA', value: mmIA.length, sub: `de ${mmRows.length} · ${BENCHMARK} ${mmIA.filter(r => r.u === USIL).length}` }
    : { label: 'IA en programas largos', value: iaLargo.length, sub: `de ${catLargo.length} · ${BENCHMARK} ${iaLargo.filter(r => r.u === USIL).length}` }
  // brochure = ficha solo en PDF (files.usil.edu.pe), sin página propia activa hoy; ver nota de USIL IE en NOTAS
  const brochureUsil = rows.filter(r => r.ia && r.u === USIL && /\.pdf(\?|$)/i.test(r.url || '')).length

  return (
    <>
      <motion.h1 className="text-[34px] lg:text-[40px] leading-[1.1] text-usil-deep m-0 mb-1" initial={CH.ANIM ? { opacity: 0, y: 12 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: CH.ANIM ? 0.6 : 0 }}>
        IA en {esPos ? 'el posgrado' : 'los institutos'}: {D.benchmark_largo} frente al mercado
      </motion.h1>
      <p className="text-xs text-muted m-0 mb-6">{UNIS.join(' · ')}{tipo !== 'Todos' ? ` · filtro: ${tipo}` : ''}</p>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-10">
        <Kpi label="Programas con IA en el mercado" value={mkt.ia} sub={`de ${mkt.total} programas · ${mkt.pct}%`} help={H.kpiMercado} />
        {/* sin catálogo con el filtro activo, pct es null y la cifra sale 's/d': un 0.0% sobre 0 programas engañaría
            en institutos, además, cuántos de los cursos IA de USIL IE existen solo como brochure PDF (ver NOTAS) */}
        <Kpi label={`Prevalencia ${BENCHMARK}`} value={usil.pct} format={v => `${v.toFixed(1)}%`} sub={`${usil.ia} de ${usil.total} · ${prev.n ? `${prev.n}° de ${prev.k}` : 's/d'}${esPos ? ' comparables' : ''}${!esPos && brochureUsil ? ` · ${brochureUsil} solo PDF` : ''}`} delay={0.05} help={H.kpiPrevalencia} />
        <Kpi label={`Líneas con IA en ${BENCHMARK}`} value={usil.lineasIA} sub={`de ${D.lineas.length} líneas · catálogo en ${new Set(rows.filter(r => r.u === USIL).map(r => r.l)).size}`} delay={0.1} help={H.kpiLineas} />
        <Kpi {...kpi4} delay={0.15} help={H.kpi4} />
        <Kpi label={`Tipos IA que ${BENCHMARK} no tiene`} value={brechas.length} sub={`de ${gs.length} tipos en el mercado`} delay={0.2} help={H.kpiBrechas} />
      </div>

      {/* 1 */}
      <SectionTitle id="s1" n="1">Quién tiene más IA</SectionTitle>
      <div className="grid lg:grid-cols-2 gap-4 mb-14">
        <Reveal minH={340}><Panel title="Prevalencia de IA en el catálogo" caption={aggU.length ? `${aggU.join(' y ')} publica por categoría: la barra rayada cuenta categorías con al menos un curso IA, no programas.` : `Cada barra es el catálogo completo al ${D.fecha}.`} help={H.prevalencia}>
          <Legend items={[[C.usil, `${BENCHMARK} con IA`], [C.comp, 'Competidor con IA'], [C.compT, 'Sin IA'], ...(aggU.length ? [['hatch', 'Conteo por categoría']] : [])]} />
          <Prevalence data={unis} nota="cat." />
        </Panel></Reveal>
        <Reveal minH={340} delay={0.1}><Panel title={`Catálogo por ${esPos ? 'nivel' : 'formato'}`} caption={`${TIPOS.join(' · ')}. Cifra junto al nombre = programas en catálogo.`} help={H.nivel}>
          <LegendNivel tipos={TIPOS} />
          <StackedNivel data={niveles} tipos={TIPOS} />
        </Panel></Reveal>
      </div>

      {/* 2 */}
      <SectionTitle id="s2" n="2">Dónde está {BENCHMARK} en el mapa</SectionTitle>
      <Reveal minH={500} className="mb-14"><Panel title="Mapa competitivo"
        caption={`Cuadrante ideal: más IA que el mercado (${mkt.pct}%) con un catálogo sobre la mediana del segmento (${Math.round(mapa.medCat)} programas). Tamaño de la burbuja = cursos con IA.${aggU.length ? ` ${aggU.join(' y ')} va con marcador hueco: cuenta categorías.` : ''}`}
        help={H.mapa}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Legend items={[[C.usil, BENCHMARK], [C.comp, 'Competidor'], [C.accentSoft, 'Cuadrante ideal']]} />
          <span className="text-xs text-ink2 mb-2">eje x: programas en catálogo, escala log · eje y: % del catálogo con IA</span>
        </div>
        <Mapa view="C" unis={mapa.pts} mkt={mkt} medCat={mapa.medCat} />
      </Panel></Reveal>
      <Reveal minH={340} className="mb-14"><Panel title={`Cuota de ${BENCHMARK} por línea: catálogo frente a IA`} caption="Líneas con 3 o más cursos IA en el mercado. Dorado = lidera el catálogo de la línea y pierde 10+ puntos en IA." help={H.dumbbell}>
        <Legend items={[[C.comp, 'Cuota del catálogo'], [C.usil, 'Cuota de los cursos IA']]} />
        <Dumbbell data={cuota.ls} tot={cuota.tot} minIA={3} usilLbl={BENCHMARK} />
      </Panel></Reveal>

      {/* 3 */}
      <SectionTitle id="s3" n="3">Formato y nivel de los cursos con IA</SectionTitle>
      <div className="grid lg:grid-cols-2 gap-4 mb-14">
        <Reveal minH={340}><Panel title={`Cursos con IA: ${CORTO.toLowerCase()} frente a formatos largos`} caption={`Izquierda: ${CORTO.toLowerCase()} con IA. Derecha: ${LARGOS.join(', ').toLowerCase()} con IA. Catálogo completo.`} help={H.butterfly}>
          <Legend items={[[C.usil, `${BENCHMARK} · ${CORTO.toLowerCase()}`], [C.gold, `${BENCHMARK} · formato largo`], [C.comp, 'Competidor']]} />
          <Butterfly data={fmts} izqLbl={CORTO.toLowerCase()} derLbl="programas largos" izqTip={`${CORTO} con IA`} derTip="Formato largo con IA" paso={5} minIzq={2} />
        </Panel></Reveal>
        <Reveal minH={340} delay={0.1}><Panel title={`En qué ${esPos ? 'nivel' : 'formato'} vende IA cada institución`} caption="Barras al 100%: reparto de los cursos con IA de cada institución. Solo instituciones con al menos un curso IA." help={H.nivelIA}>
          <LegendNivel tipos={TIPOS} />
          <StackedNivel data={nivelIA} tipos={TIPOS} pct vacio="Ninguna institución vende IA con este filtro" />
        </Panel></Reveal>
      </div>
      <Reveal minH={260} className="mb-14"><Panel title="IA de uso frente a IA de construcción" caption="Construcción = programas de datos, machine learning o desarrollo de software con IA; uso = aplicar IA en otras disciplinas. Criterio editorial." help={H.construccion}>
        <Legend items={[[C.usil, `${BENCHMARK} · construcción`], [C.usilT, `${BENCHMARK} · uso`], [C.comp, 'Competidor · construcción'], [C.compT, 'Competidor · uso']]} />
        <ConstruccionUso data={construccion} />
      </Panel></Reveal>
      {esPos && <Reveal minH={360} className="mb-14"><Panel title="Programas de IA en maestrías y doctorados" caption="De IA/datos = el tema del título es IA, datos o analítica. Aplica IA = programa de otra disciplina con IA en su contenido." help={H.maestriasDoc}>
        <Legend items={[[C.comp, 'De IA/datos', 'dot'], [C.compT, 'Aplica IA', 'dot'], ['hollow', 'Doctorado sin IA']]} />
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <h4 className="text-[13px] font-semibold text-usil-deep mb-3">Maestrías y MBA</h4>
            <MastersDots data={maestriasData} />
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-usil-deep mb-3">Doctorados</h4>
            <DoctoralDots data={doctoradosData} />
          </div>
        </div>
      </Panel></Reveal>}

      {/* 4 */}
      <SectionTitle id="s4" n="4">Dónde hay oferta y dónde falta</SectionTitle>
      <Reveal minH={600} className="mb-14"><Panel title="Línea de carrera por institución" aside={<Segmented value={heatMode} onChange={setHeatMode} options={['n', 't']} small />} caption={heatMode === 'n' ? 'n · cantidad de cursos con IA. Cuanto más oscura la celda, más oferta.' : 't · programas en catálogo, con o sin IA.'} help={H.heat}>
        <Heat rows={heatRows} mode={heatMode} totals={unis} unis={UNIS} aggU={aggU} />
        {!!aggU.length && <p className="text-xs text-muted m-0 mt-2">* {aggU.join(' y ')}: cada celda es una categoría, no un programa.</p>}
      </Panel></Reveal>

      {/* 5 */}
      <SectionTitle id="s5" n="5">Lo que otros venden con IA y {BENCHMARK} no</SectionTitle>
      <Reveal minH={280} className="mb-8"><Panel title="Amplitud de la apuesta IA" caption="Cada cuadro es uno de los 12 temas IA del segmento; lleno = la institución tiene al menos un programa ahí." help={H.amplitud}>
        <AmplitudGrid data={amplitud} />
      </Panel></Reveal>
      <Reveal minH={400} className="mb-14"><Panel title="Tipos de curso con IA en el mercado"
        aside={<Segmented value={soloBrechas} onChange={setSoloBrechas} options={['Todos', `${BENCHMARK} no tiene`]} small />}
        caption={`Prev. = % de los ${COMPS.length} competidores con al menos un curso de ese tipo. Clic en una fila para ver los cursos.${hayCategorias ? ` * = registro por categoría (${catRows.length} sin página propia).` : ''}`} help={H.grupos}>
        <GroupTable data={soloBrechas === 'Todos' ? gs : brechas} comps={COMPS} usilLbl={BENCHMARK} extra={r => r.t} anchoComps={320} />
      </Panel></Reveal>

      {/* 6 */}
      <SectionTitle id="s6" n="6">{acciones.length === 5 ? 'Cinco' : 'Cuatro'} acciones</SectionTitle>
      <div className="grid lg:grid-cols-[2fr_3fr] gap-4 mb-4">
        <Reveal minH={320}><Panel title="Priorización" caption="Zona dorada = empezar aquí. Color = riesgo de implementación." help={H.matriz}>
          <Legend items={[[RISK[1], 'Riesgo bajo'], [RISK[2], 'Riesgo medio'], [RISK[3], 'Riesgo alto']]} />
          <ActionMatrix actions={acciones} />
        </Panel></Reveal>
        <Reveal minH={320} delay={0.1}><Panel title="Variables de negocio" caption="Sin competitividad de pricing: este segmento no tiene precio publicado comparable." help={H.variables}>
          <div className="flex flex-col divide-y divide-line">
            {variables.map(v => {
              const hits = acciones.map((a, i) => a.variables.includes(v.name) ? i + 1 : null).filter(Boolean)
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
        {acciones.map((a, i) => <Reveal key={a.title} minH={120} delay={i * 0.06}><ActionRow a={a} i={i} /></Reveal>)}
      </div>


      <footer className="text-xs text-muted pb-8">Catálogos públicos al {D.fecha} · sin precio publicado comparable · {mkt.total} programas de {UNIS.length} instituciones</footer>
    </>
  )
}
