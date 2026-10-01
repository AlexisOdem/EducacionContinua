import { useMemo, useState } from 'react'
import D from './data.json'
import DI from './data_institutos.json'
import DP from './data_posgrado.json'
import { isUsil, S } from './stats'
import { Panel } from './ui'
import { Segmented } from './charts'

/* Toda la oferta de USIL con IA en una sola lista (educación continua, instituto y posgrado), agrupada por las
   categorías ya clasificadas: la línea de carrera (común a los tres segmentos) o el tema de IA curado de cada curso.
   App.jsx carga este módulo con lazy(): comparte el chunk de filas de institutos y posgrado con segmento.jsx. */
const UNIDAD = {
  USIL: ['Educación Continua', 'bg-usil-wash text-usil-deep'],
  'USIL IE': ['Instituto', 'bg-gold-soft text-gold-ink'],
  'USIL EPG': ['Posgrado', 'bg-usil-deep text-white'],
}
const ROWS = [D, DI, DP].flatMap(d => d.rows.filter(r => r.ia && isUsil(r.u)))
const POR = { 'Línea de carrera': 'l', 'Tema de IA': 'g' }

export default function Oferta() {
  const [por, setPor] = useState('Línea de carrera')
  const k = POR[por], otro = k === 'l' ? 'g' : 'l'
  const gs = useMemo(() => {
    const m = new Map()
    for (const r of ROWS) { const c = r[k] || 'Sin clasificar'; m.set(c, [...(m.get(c) || []), r]) }
    return [...m].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
  }, [k])

  return <>
    <h1 className="text-[34px] lg:text-[40px] leading-[1.1] text-usil-deep m-0 mb-1">Oferta de USIL con IA</h1>
    <p className="text-xs text-muted m-0 mb-5">
      {ROWS.length} programas con IA · {Object.entries(UNIDAD).map(([u, [t]]) => `${t} ${ROWS.filter(r => r.u === u).length}`).join(' · ')} · {gs.length} categorías
    </p>
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-5">
      <Segmented value={por} onChange={setPor} options={Object.keys(POR)} small />
      <div className="flex flex-wrap gap-2 text-[11px]">{Object.values(UNIDAD).map(([t, cls]) => <span key={t} className={`px-2 py-0.5 rounded-full font-semibold ${cls}`}>{t}</span>)}</div>
    </div>

    <div className="lg:columns-2 gap-4 mb-10">
      {gs.map(([c, rs]) => (
        <Panel key={c} title={c} aside={<span className="num text-xl text-usil-deep">{rs.length}</span>} className="break-inside-avoid mb-4">
          <div className="flex flex-col divide-y divide-line -my-1">
            {rs.map(r => (
              <a key={r.id || r.url} href={r.url} target="_blank" rel="noopener" className="group grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2 no-underline">
                <span className="min-w-0">
                  <span className="block text-[13.5px] leading-snug text-ink group-hover:text-usil">{r.n}</span>
                  <span className="block text-xs text-muted">{[r[otro], r.t, r.d].filter(Boolean).join(' · ')}</span>
                </span>
                <span className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${UNIDAD[r.u][1]}`}>{UNIDAD[r.u][0]}</span>
                  {r.p != null && <span className="block text-xs text-ink2 tabular-nums mt-0.5">{S(r.p)}</span>}
                </span>
              </a>
            ))}
          </div>
        </Panel>
      ))}
    </div>

    <footer className="text-xs text-muted pb-8">Catálogos públicos al {D.fecha} (educación continua) y {DI.fecha} (instituto y posgrado) · precio de lista público general, solo educación continua lo publica · clic en un programa abre su página</footer>
  </>
}
