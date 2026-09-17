import { motion } from 'motion/react'
import { ANIM, Counter } from './charts'

/* ⓘ de lectura: al pasar el mouse o enfocar con teclado muestra qué muestra el gráfico, cómo leerlo
   y qué mirar, en frases de una línea sin jerga. CSS puro (grupo con hover/focus-within), sin librería. */
const HelpIcon = ({ help }) => (
  <div className="relative inline-flex shrink-0 group/help">
    <button type="button" aria-label="Cómo leer este gráfico" className="w-5 h-5 grid place-items-center rounded-full text-muted hover:text-usil-deep focus-visible:text-usil-deep outline-none focus-visible:ring-2 focus-visible:ring-usil cursor-help">
      <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 9.2v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="10" cy="6.1" r="1.1" fill="currentColor" />
      </svg>
    </button>
    <div role="tooltip" className="invisible opacity-0 group-hover/help:visible group-hover/help:opacity-100 group-focus-within/help:visible group-focus-within/help:opacity-100 transition-opacity duration-150 pointer-events-none absolute right-0 top-full mt-2 z-30 w-[min(340px,calc(100vw-32px))] rounded-lg border border-line bg-white p-3.5 shadow-lg text-left">
      <dl className="m-0 flex flex-col gap-2.5">
        <div><dt className="text-[10.5px] font-semibold uppercase tracking-wide text-usil-deep">Qué muestra</dt><dd className="m-0 mt-0.5 text-[12.5px] text-ink2 leading-snug">{help.que}</dd></div>
        <div><dt className="text-[10.5px] font-semibold uppercase tracking-wide text-usil-deep">Cómo leerlo</dt><dd className="m-0 mt-0.5 text-[12.5px] text-ink2 leading-snug">{help.como}</dd></div>
        <div><dt className="text-[10.5px] font-semibold uppercase tracking-wide text-usil-deep">Qué mirar</dt><dd className="m-0 mt-0.5 text-[12.5px] text-ink2 leading-snug">{help.mira}</dd></div>
      </dl>
    </div>
  </div>
)

/* Un solo patrón de panel: cabecera (título + control + ⓘ), cuerpo, aclaración.
   help = { que, como, mira }: si existe, la cabecera lleva el icono de lectura. */
export const Panel = ({ title, aside, caption, help, children, className = '' }) => (
  <section className={`bg-surface rounded-lg border border-line min-w-0 ${className}`}>
    <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-line">
      <h3 className="text-[17px] m-0">{title}</h3>
      <div className="flex items-center gap-3">{aside}{help && <HelpIcon help={help} />}</div>
    </header>
    <div className="px-5 pt-4 pb-3 overflow-hidden">{children}</div>
    {caption && <p className="text-xs text-muted px-5 pb-3 m-0">{caption}</p>}
  </section>
)

export const Kpi = ({ label, value, sub, delay = 0, format, help, className = '' }) => (
  /* ?static: sin entrada escalonada, o la captura headless se lleva las tarjetas a medio aparecer */
  <motion.div className={`relative rounded-lg border border-line px-4 py-3 min-w-0 ${className || 'bg-surface'}`} initial={ANIM ? { opacity: 0, y: 12 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: ANIM ? 0.5 : 0, delay: ANIM ? delay : 0 }}>
    {help && <div className="absolute top-2 right-2">{<HelpIcon help={help} />}</div>}
    <div className="text-xs text-muted truncate pr-5">{label}</div>
    <div className="num text-[34px] leading-tight text-usil-deep">{typeof value === 'number' || value === null ? <Counter value={value} format={format} /> : value}</div>
    <div className="text-xs text-ink2 truncate">{sub}</div>
  </motion.div>
)
