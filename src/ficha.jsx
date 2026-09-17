import { memo, useState } from 'react'
import { motion } from 'motion/react'
import { S, FECHA, isUsil, lista } from './stats'
import { Panel, Kpi } from './ui'
import * as CH from './charts'
const { Reveal, Segmented, Legend, C } = CH
const [Prevalence, StackedTipo, Jitter, PriceDots, PriceLadder, GroupTable] =
  [CH.Prevalence, CH.StackedTipo, CH.Jitter, CH.PriceDots, CH.PriceLadder, CH.GroupTable].map(c => memo(c))

const TONO = { usil: C.usil, comp: C.comp, gold: C.gold }
const TH = 'py-2 px-2 font-medium border-b border-line text-left'
const TD = 'py-1.5 px-2 border-b border-line'

/* Ayuda de lectura de cada panel de la ficha por línea de carrera. */
const HELP = {
  quien: { que: 'Qué universidades tienen catálogo en esta línea de carrera, y cuánto de ese catálogo tiene IA.', como: 'Modo IA: la parte llena de la barra es con IA. Modo Tipo: compara curso corto con especialización y diplomado.', mira: 'Si USIL aparece y qué proporción de su catálogo en la línea ya tiene IA.' },
  precio: { que: 'El precio de lista de los programas de esta línea, uno por punto, y la escalera de precio con IA debajo.', como: 'Los puntos llenos son con IA; la barra corta es la mediana. En la escalera, dorado significa que USIL vende 50% o más por debajo del mercado.', mira: 'Dónde se ubica el precio del curso IA de USIL frente a la competencia.' },
  tematicas: { que: 'Los tipos de curso con IA que existen dentro de esta línea de carrera, y quién los vende.', como: 'El círculo o la equis de la derecha dicen si USIL tiene ese tipo; clic en la fila despliega los cursos.', mira: 'Las filas con la equis: temas de IA de la línea que la competencia ya vende y USIL no.' },
  cursos: { que: 'El listado completo de los cursos con IA de esta línea, con su universidad y precio.', como: 'Ordenado por universidad; s/d significa que la universidad no publica precio para ese curso.', mira: 'Cuántos cursos de USIL aparecen en la lista frente a los de la competencia.' },
  lectura: { que: 'Tres frases con la lectura automática de esta línea, según sus cifras de catálogo, IA y precio.', como: 'El color del punto dice si la frase es favorable para USIL (azul), neutral (gris) o una alerta (dorado).', mira: 'Las frases doradas: son las que piden una decisión.' },
  kpiTotal: { que: 'Cuántos programas tiene el mercado en esta línea de carrera, con o sin IA.', como: 'Es el tamaño de la oportunidad: cuántos programas compiten en esta línea.', mira: 'Si la línea es lo bastante grande para justificar invertir en un curso con IA.' },
  kpiUsilIA: { que: 'Cuántos de los programas de USIL en esta línea ya incorporan IA, sobre su catálogo total en la línea.', como: 'La tarjeta se resalta en dorado cuando USIL tiene cero cursos IA y el mercado ya vende alguno.', mira: 'Si USIL ya compite en IA en esta línea o si es un hueco por cubrir.' },
  kpiPrecioUsil: { que: 'El precio mediano del curso con IA de USIL en esta línea, frente a la mediana de los competidores.', como: 'Compara ambas cifras directamente; "muestra pequeña" avisa cuando hay pocos cursos IA para sacar una mediana confiable.', mira: 'Si USIL cobra por encima o por debajo del precio que el mercado ya acepta pagar por IA.' },
  kpiIndice: { que: 'El precio del curso IA de USIL como porcentaje de la mediana de los competidores con IA.', como: '100% es paridad de precio; por debajo de 100% USIL cobra menos, por encima cobra más.', mira: 'Si el índice está muy por debajo de 100%: puede indicar que USIL está regalando su prima de IA.' },
  kpiPuesto: { que: 'La posición de USIL frente a la competencia en volumen de catálogo y, aparte, en precio del curso IA.', como: 'Cuenta solo instituciones con programas en esta línea; "s/d" significa que no hay base para calcular el puesto.', mira: 'Si USIL lidera volumen pero no precio, o viceversa: señala dónde enfocar la decisión.' },
}

/* Panel 5 — cursos con IA de la línea */
const CursosIA = ({ rows }) => !rows.length
  ? <div className="py-8 text-center text-muted text-sm">Ninguna universidad vende cursos con IA en esta línea.</div>
  : (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px] border-collapse min-w-[560px]">
        <thead><tr className="text-xs text-ink2">
          <th className={TH}>Universidad</th><th className={TH}>Curso</th><th className={TH}>Tipo</th>
          <th className={`${TH} text-right`}>Precio</th><th className={`${TH} text-right`}>Ficha</th>
        </tr></thead>
        <tbody>{rows.map(r => (
          <tr key={r.url} className="hover:bg-usil-wash transition-colors duration-150">
            <td className={`${TD} ${isUsil(r.u) ? 'text-usil-deep font-semibold' : 'text-ink2'}`}>{r.u}</td>
            <td className={TD}>{r.n}</td>
            <td className={`${TD} text-ink2`}>{r.t}</td>
            <td className={`${TD} text-right tabular-nums`}>{S(r.p)}</td>
            <td className={`${TD} text-right`}><a href={r.url} target="_blank" rel="noopener" className="text-usil no-underline hover:underline">ver ↗</a></td>
          </tr>))}
        </tbody>
      </table>
    </div>
  )

/* Panel 6 — 3 frases por reglas; el punto dice si es favorable, neutral o alerta */
const Lectura = ({ items }) => (
  <ul className="m-0 p-0 list-none flex flex-col gap-3">
    {items.map(x => (
      <li key={x.t} className="grid grid-cols-[10px_minmax(0,1fr)] gap-3 items-baseline text-[14px]">
        <i className="w-2.5 h-2.5 rounded-full translate-y-0.5" style={{ background: TONO[x.c] }} />
        <span>{x.t}</span>
      </li>
    ))}
  </ul>
)

export default function Ficha({ d, tipo }) {
  const [modo, setModo] = useState('IA')
  const [soloBrechas, setSoloBrechas] = useState(d.arq === 'hueco' ? 'USIL no tiene' : 'Todos')
  const brechas = d.gs.filter(g => !g.nUsil && g.k)
  const conPrecioIA = d.cursosIA.filter(r => r.p)
  const muestra = d.arq === 'muestra'

  const kpi2Vacio = d.usilIA === 0 && d.mktIA > 0
  const sinPrecio = d.sinPrecio.length ? ` ${lista(d.sinPrecio)} no ${d.sinPrecio.length > 1 ? 'publican' : 'publica'} precio en esta línea.` : ''
  const cap3 = muestra
    ? `Escala logarítmica. Muestra pequeña: ${conPrecioIA.length} cursos IA con precio en la línea.`
    : `Cada punto es un programa. Barra corta = mediana.${sinPrecio}`

  const p2 = (
    <Panel title={d.arq === 'nicho' ? 'USIL frente al resto' : 'Quién ofrece qué en la línea'}
      aside={<Segmented value={modo} onChange={setModo} options={['IA', 'Tipo']} small />}
      caption="Universidades sin programas en la línea no aparecen." help={HELP.quien}>
      {modo === 'IA'
        ? <><Legend items={[[C.usil, 'USIL con IA'], [C.comp, 'Competidor con IA'], [C.compT, 'Sin IA']]} /><Prevalence data={d.unis} /></>
        : <><Legend items={[[C.usil, 'USIL · curso corto'], [C.usilT, 'USIL · especialización y diplomado'], [C.comp, 'Competidor · curso corto'], [C.compT, 'Competidor · especialización y diplomado']]} /><StackedTipo data={d.porTipo} /></>}
    </Panel>
  )

  const p3 = (
    <Panel title={d.arq === 'nicho' ? 'Precio en USIL: con IA frente a sin IA' : d.arq === 'hueco' ? 'Precio de referencia de los competidores' : 'Precio de lista en la línea'} caption={cap3} help={HELP.precio}>
      {muestra ? <PriceDots rows={conPrecioIA} />
        : d.conPrecio.length
          ? <><Legend items={[[C.usil, 'USIL con IA'], [C.usilT, 'USIL sin IA'], [C.comp, 'Competidor con IA'], [C.compT, 'Competidor sin IA']]} /><Jitter points={d.puntos} unis={d.unis} us={d.conPrecio} /></>
          : <div className="h-[200px] flex items-center justify-center text-muted text-sm">Ninguna universidad publica precio en esta línea</div>}
      {d.arq === 'batalla' && d.ladder.length > 0 && (
        <div className="mt-6 pt-4 border-t border-line">
          <h4 className="text-[15px] m-0 mb-2">Escalera de precio: USIL sin IA → USIL con IA → competidores con IA</h4>
          <Legend items={[[C.usilT, 'USIL sin IA'], [C.usil, 'USIL con IA'], [C.comp, 'Competidores con IA']]} />
          <PriceLadder data={d.ladder} />
        </div>
      )}
    </Panel>
  )

  const p4 = (
    <Panel title="Temáticas IA en la línea"
      aside={d.gs.length > 0 && <Segmented value={soloBrechas} onChange={setSoloBrechas} options={['Todos', 'USIL no tiene']} small />}
      caption="Prev. = % de los 5 competidores con al menos un curso de ese tipo en esta línea. Clic en una fila para ver los cursos." help={HELP.tematicas}>
      {d.gs.length ? <GroupTable data={soloBrechas === 'Todos' ? d.gs : brechas} /> : <div className="py-8 text-center text-muted text-sm">Ningún curso IA clasificado en esta línea.</div>}
    </Panel>
  )

  const p5 = <Panel title="Cursos con IA en la línea" caption="Precio de lista público; s/d cuando la universidad no lo publica." help={HELP.cursos}><CursosIA rows={d.cursosIA} /></Panel>
  const p6 = <Panel title="Lectura de la línea" help={HELP.lectura}><Lectura items={d.insights} /></Panel>

  const paneles = { p2, p3, p4, p5, p6 }
  const orden = muestra ? ['p5', 'p2', 'p3', 'p4', 'p6'] : ['p2', 'p3', 'p4', 'p5', 'p6']

  return (
    <>
      <motion.h1 className="text-[34px] lg:text-[40px] leading-[1.1] text-usil-deep m-0 mb-1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>{d.l}</motion.h1>
      <p className="text-xs text-muted m-0 mb-6">USIL frente al mercado · {FECHA}{tipo !== 'Todos' ? ` · filtro: ${tipo}` : ''}</p>

      {/* 1 · KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-10">
        <Kpi label="Programas en la línea" value={d.total} sub={`${d.mkt.pct ?? 0}% con IA en el mercado`} help={HELP.kpiTotal} />
        <Kpi label="Cursos IA de USIL" value={d.usilIA} delay={0.05} className={kpi2Vacio ? 'bg-gold-soft' : ''}
          sub={kpi2Vacio ? `0 de ${d.usilTot} · el mercado ya tiene ${d.mktIA}` : `de ${d.usilTot} programas USIL · cuota ${d.cuota}% del catálogo`} help={HELP.kpiUsilIA} />
        <Kpi label="Precio curso IA USIL" value={d.usil.medIA} format={S} delay={0.1}
          sub={`mediana competidores ${S(d.medComp)}${muestra ? ' · muestra pequeña' : ''}`} help={HELP.kpiPrecioUsil} />
        <Kpi label="USIL frente al mercado" value={d.indice} format={v => `${Math.round(v)}%`} delay={0.15} sub="100% = mismo precio que la mediana de los competidores" help={HELP.kpiIndice} />
        <Kpi label="Puesto de USIL en volumen" value={d.puestoVol ? `${d.puestoVol}° de ${d.k}` : 's/d'} delay={0.2}
          sub={d.puestoPrecio ? `${d.puestoPrecio}° de ${d.kp} en precio IA` : 'sin precio IA'} help={HELP.kpiPuesto} />
      </div>

      {orden.map((key, i) => <Reveal key={key} minH={320} delay={i ? 0 : 0.05} className="mb-4">{paneles[key]}</Reveal>)}

      <footer className="text-xs text-muted pt-8 pb-8">Catálogos públicos al {FECHA} · posgrado excluido · precio de lista público general</footer>
    </>
  )
}
