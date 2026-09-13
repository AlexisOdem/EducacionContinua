import { motion } from 'motion/react'
import { Counter } from './charts'

/* Un solo patrón de panel: cabecera (título + control), cuerpo, aclaración. */
export const Panel = ({ title, aside, caption, children, className = '' }) => (
  <section className={`bg-surface rounded-lg border border-line min-w-0 overflow-hidden ${className}`}>
    <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-line">
      <h3 className="text-[17px] m-0">{title}</h3>
      {aside}
    </header>
    <div className="px-5 pt-4 pb-3">{children}</div>
    {caption && <p className="text-xs text-muted px-5 pb-3 m-0">{caption}</p>}
  </section>
)

export const Kpi = ({ label, value, sub, delay = 0, format, className = '' }) => (
  <motion.div className={`rounded-lg border border-line px-4 py-3 min-w-0 ${className || 'bg-surface'}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}>
    <div className="text-xs text-muted truncate">{label}</div>
    <div className="num text-[34px] leading-tight text-usil-deep">{typeof value === 'number' || value === null ? <Counter value={value} format={format} /> : value}</div>
    <div className="text-xs text-ink2 truncate">{sub}</div>
  </motion.div>
)
