import { StrictMode, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { motion, AnimatePresence, MotionConfig, useScroll } from 'motion/react'
import './index.css'
import { makeStats } from './stats'
import { Panel, Kpi } from './ui'
import { Reveal, Segmented, Legend, Prevalence, ANIM, C } from './charts'
import { ACCIONES } from './acciones_posgrado'
import DP from './data_posgrado.json'
import logo from './assets/logo-usil-30.png'

/* /alexis/: la propuesta para la EPG como página, no como PPT. Solo se entra por link (el dashboard no la enlaza).
   Lo de competencia sale del dato real de posgrado (mismo makeStats que el dashboard, así las cifras no se desalinean);
   la limpieza, el embudo y el CRM son ficticios y lo dicen. */
const ds = makeStats(DP)
const DASH = '../?seg=posgrado'
const EASE = [0.22, 1, 0.36, 1]
const ini = v => ANIM ? v : false  // ?static: todo quieto para capturas

const NAV = [['diagnostico', 'Diagnóstico'], ['hecho', 'Ya hecho'], ['frentes', 'Tres frentes'], ['embudo', 'Embudo'], ['crm', 'CRM v1'], ['vision', 'Visión'], ['plan', '90 días']]

/* Sección activa del menú: la que cruza la franja central de la pantalla. */
function useActiva() {
  const [a, setA] = useState(null)
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setA(e.target.id)), { rootMargin: '-35% 0px -60% 0px' })
    NAV.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el) })
    return () => io.disconnect()
  }, [])
  return a
}

const SectionTitle = ({ id, n, children, sub }) => (
  <motion.div id={id} className="scroll-mt-28 mb-5" initial={ini({ opacity: 0, x: -24 })} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 0.6, ease: EASE }}>
    <div className="flex items-baseline gap-4">
      <span className="font-display text-4xl leading-none text-usil-tint">{n}</span>
      <h2 className="text-[26px] leading-tight m-0">{children}</h2>
    </div>
    {sub && <p className="text-[14px] text-ink2 m-0 mt-2 lg:pl-12 max-w-[760px]">{sub}</p>}
  </motion.div>
)
const Ficticio = () => <span className="inline-block px-2 py-0.5 rounded-full bg-gold-soft text-gold-ink text-[11px] font-semibold whitespace-nowrap">Datos ficticios</span>
const Tag = ({ gold, children }) => <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${gold ? 'bg-gold text-usil-deep' : 'bg-usil-wash text-usil-deep'}`}>{children}</span>
const Paso = ({ n }) => <span className="w-7 h-7 shrink-0 rounded-full grid place-items-center bg-usil-deep text-white font-display text-[15px] font-semibold">{n}</span>
const stagger = i => ({ initial: ini({ opacity: 0, y: 16 }), whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.4 }, transition: { duration: 0.5, ease: EASE, delay: i * 0.1 } })

/* 1 · Hoy frente a la propuesta */
const HOY = [['Base en Word y Excel', 'Cada área con su archivo'], ['Llamada masiva', 'A toda la base, por igual'], ['Misma oferta', 'El catálogo completo a todos'], ['Sin registro', 'No se sabe por qué no compró']]
const MANANA = [['Base única', 'Limpia y sin duplicados'], ['Prioridad por puntaje', 'Primero quien más probable compra'], ['Oferta por perfil', 'Carrera × etapa profesional'], ['Embudo medido', 'Motivo de caída en cada etapa']]
const Flujo = ({ pasos, bueno }) => (
  <div className="relative">
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
      {pasos.map(([t, s], i) => (
        <motion.div key={t} {...stagger(bueno ? i + 4 : i)} whileHover={{ y: -3 }}
          className={`relative rounded-lg px-4 py-3 border ${bueno ? 'bg-usil-wash border-usil-tint' : 'bg-bg border-line'}`}>
          <div className="text-[11px] text-muted">Paso {i + 1}</div>
          <div className={`font-semibold text-[15px] ${bueno ? 'text-usil-deep' : 'text-ink line-through decoration-comp-tint'}`}>{t}</div>
          <div className="text-[12.5px] text-ink2">{s}</div>
          {i < pasos.length - 1 && <span className="hidden lg:grid absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-5 h-5 place-items-center rounded-full bg-white border border-line text-muted text-xs" aria-hidden>→</span>}
        </motion.div>
      ))}
    </div>
    {/* la línea dorada recorre la propuesta de izquierda a derecha */}
    {bueno && <motion.div className="hidden lg:block h-1 mt-2 rounded-full bg-gold origin-left" initial={ini({ scaleX: 0 })} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, ease: EASE, delay: 0.9 }} />}
  </div>
)

/* 3 · Los tres frentes */
const FRENTES = [
  { n: 1, tag: 'Mes 1', gold: true, t: 'Ordenar y automatizar', que: 'Pasar la base de egresados e interesados a un solo lugar, segmentarla y dejar de llamar a todos por igual.', entrego: ['Base unificada y sin duplicados', 'Plantillas de correo y WhatsApp por perfil, redactadas con IA', 'Lista diaria priorizada para cada asesor'], kpi: 'Horas de llamada por matrícula' },
  { n: 2, tag: 'Mes 2–3', gold: true, t: 'Embudo y attrition', que: 'Medir cuánta gente pasa de una etapa a la siguiente y registrar por qué se cae en cada una.', entrego: ['Etapas y motivo de caída en la herramienta del asesor', 'Dashboard del embudo', 'Reporte mensual de la etapa más crítica'], kpi: 'Conversión de contactado a matriculado' },
  { n: 3, tag: 'Visión', t: 'Inteligencia de mercado', que: 'Cruzar lo que vende la competencia (ya hecho), lo que pide el mercado y la matrícula interna para decidir qué lanzar y cómo venderlo.', entrego: ['Actualización mensual del dashboard de competencia', 'Señales de demanda de fuentes públicas', 'Matriz de portafolio por programa'], kpi: '% de programas nuevos que llenan su 1.ª cohorte' },
]

/* 4 · Embudo (ficticio). La etapa con mayor caída se elige sola al abrir. */
const ETAPAS = [
  { e: 'Contactados', n: 1200 },
  { e: 'Responden', n: 480, motivos: [['No contesta', 55], ['Número desactualizado', 25], ['Pide no ser llamado', 20]], accion: 'Dejar de llamar a toda la base: limpiar números, priorizar por puntaje y abrir por WhatsApp o correo con una oferta según su perfil.' },
  { e: 'Piden información', n: 216, motivos: [['El programa no encaja con su carrera', 50], ['Ya estudia en otro lado', 30], ['No es su momento', 20]], accion: 'Ofrecer el programa que corresponde a su carrera y etapa profesional, no el catálogo completo.' },
  { e: 'Postulan', n: 97, motivos: [['Precio', 40], ['Horario', 35], ['Requisitos de admisión', 25]], accion: 'Mostrar financiamiento y horarios desde el primer contacto y resolver requisitos con una lista clara.' },
  { e: 'Admitidos', n: 85, motivos: [['Documentos incompletos', 60], ['No se presentó a la entrevista', 40]], accion: 'Recordatorios automáticos de documentos y de la entrevista.' },
  { e: 'Matriculados', n: 51, motivos: [['Precio o financiamiento', 45], ['Eligió otra escuela', 30], ['Cambio en el trabajo', 25]], accion: 'Seguimiento en 48 h tras la admisión, plan de pagos y un comparativo frente a la competencia (sale del dashboard).' },
  { e: 'Terminan el 1.er ciclo', n: 44, motivos: [['Carga laboral', 50], ['Atraso en pagos', 30], ['Expectativas no cumplidas', 20]], accion: 'Alerta temprana por inasistencia o mora, antes de que el alumno se retire.' },
].map((s, i, a) => i ? { ...s, perdidos: a[i - 1].n - s.n, caida: Math.round(100 * (a[i - 1].n - s.n) / a[i - 1].n) } : s)
const PEOR = ETAPAS.reduce((m, s, i) => (s.caida ?? 0) > (ETAPAS[m].caida ?? 0) ? i : m, 0)
const PULSO = ['0 0 0 0 rgba(255,199,44,.7)', '0 0 0 12px rgba(255,199,44,0)']

function Embudo() {
  const [sel, setSel] = useState(PEOR)
  const s = ETAPAS[sel], top = ETAPAS[0].n
  return (
    <div className="grid lg:grid-cols-[3fr_2fr] gap-4">
      <Panel title="Embudo del postulante" aside={<Ficticio />} caption={`Clic en una etapa para ver por qué se cae la gente. Dorado = la mayor caída. Conversión total: ${(100 * ETAPAS.at(-1).n / top).toFixed(1)}%.`}>
        <div className="flex flex-col gap-1 py-1">
          {ETAPAS.map((x, i) => (
            <div key={x.e}>
              {i > 0 && <motion.div initial={ini({ opacity: 0 })} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.1 }} className={`text-center text-[11.5px] leading-5 ${i === PEOR ? 'text-gold-ink font-semibold' : 'text-muted'}`}>▼ −{x.caida}% ({x.perdidos} se pierden)</motion.div>}
              <motion.button onClick={() => i && setSel(i)} disabled={!i} aria-pressed={sel === i}
                initial={ini({ width: '0%' })}
                animate={{ width: `${Math.max(34, 100 * x.n / top)}%`, boxShadow: i === PEOR && ANIM ? PULSO : '0 0 0 0 rgba(0,0,0,0)' }}
                transition={{ width: { duration: 0.8, ease: EASE, delay: i * 0.1 }, boxShadow: { duration: 1.8, repeat: Infinity, delay: 1.2 } }}
                whileHover={i ? { scale: 1.02 } : undefined}
                className={`block mx-auto h-10 rounded-md text-[13px] font-medium whitespace-nowrap overflow-hidden ${i ? 'cursor-pointer' : 'cursor-default'} ${sel === i ? 'outline-2 outline-offset-2 outline-usil-deep' : ''}`}
                style={{ background: i === PEOR ? C.gold : i === 0 ? C.usilT : C.usil, color: i === PEOR ? C.ink : i === 0 ? '#002F6C' : '#fff' }}>
                {x.e} · <span className="num">{x.n.toLocaleString('en-US')}</span>
              </motion.button>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title={`De ${ETAPAS[sel - 1].e.toLowerCase()} a ${s.e.toLowerCase()}`} aside={<Ficticio />}>
        <AnimatePresence mode="wait">
          <motion.div key={sel} initial={ini({ opacity: 0, y: 10 })} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
            <div className="num text-[40px] leading-none text-usil-deep">−{s.caida}%</div>
            <p className="text-[13px] text-ink2 m-0 mt-1 mb-4">{s.perdidos} de {ETAPAS[sel - 1].n} personas no pasan a la siguiente etapa.</p>
            <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Por qué se caen</div>
            <div className="flex flex-col gap-2 mb-5">
              {s.motivos.map(([m, p], k) => (
                <div key={m}>
                  <div className="flex justify-between text-[13px]"><span>{m}</span><span className="num">{p}%</span></div>
                  <div className="h-2 rounded-full bg-line overflow-hidden"><motion.div className="h-full rounded-full bg-usil" initial={ini({ width: 0 })} animate={{ width: `${p}%` }} transition={{ duration: 0.6, delay: 0.1 + k * 0.1 }} /></div>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-gold-soft px-4 py-3">
              <div className="text-[11px] uppercase tracking-wide text-gold-ink font-semibold mb-1">Acción de ventas</div>
              <p className="text-[13.5px] text-ink m-0">{s.accion}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </Panel>
    </div>
  )
}

/* Un valor que va rotando (las maquetas de "cómo se mide" se mueven solas). */
function useRota(xs, ms = 1800) {
  const [i, setI] = useState(0)
  useEffect(() => { if (!ANIM) return; const t = setInterval(() => setI(k => (k + 1) % xs.length), ms); return () => clearInterval(t) }, [xs, ms])
  return xs[i]
}
const Rota = ({ v }) => (
  <AnimatePresence mode="wait">
    <motion.span key={v} className="inline-block" initial={ini({ opacity: 0, y: 8 })} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>{v}</motion.span>
  </AnimatePresence>
)
const Select = ({ label, v }) => (
  <div className="mt-3">
    <div className="text-[11px] text-muted mb-1">{label}</div>
    <div className="flex items-center justify-between rounded-md border border-line bg-white px-3 py-2 text-[13px] text-ink overflow-hidden"><Rota v={v} /><span className="text-muted">▾</span></div>
  </div>
)
const ETAPA_NOMBRES = ETAPAS.map(e => e.e)
const MOTIVOS = ['Precio', 'Horario', 'No contesta', 'Eligió otra escuela', 'No es su momento']

/* Cómo se alimenta el embudo: el asesor no escribe texto libre, elige de listas fijas; el tablero solo cuenta. */
function ComoSeMide() {
  const etapa = useRota(ETAPA_NOMBRES), motivo = useRota(MOTIVOS, 2300)
  const barras = [100, 40, 18, 8, 7, 4]
  return (
    <div className="grid md:grid-cols-3 gap-4 mt-4">
      <motion.div {...stagger(0)} className="bg-surface rounded-lg border border-line p-4">
        <div className="flex items-center gap-2"><Paso n="1" /><div className="font-semibold text-usil-deep text-[15px]">El asesor marca la etapa</div></div>
        <p className="text-[12.5px] text-ink2 m-0 mt-2">En cada llamada elige en qué etapa quedó la persona. Una lista desplegable, no texto libre.</p>
        <Select label="Etapa" v={etapa} />
      </motion.div>
      <motion.div {...stagger(1)} className="bg-surface rounded-lg border border-line p-4">
        <div className="flex items-center gap-2"><Paso n="2" /><div className="font-semibold text-usil-deep text-[15px]">Si se cae, elige el motivo</div></div>
        <p className="text-[12.5px] text-ink2 m-0 mt-2">Al cerrar un caso, el motivo es obligatorio y sale de una lista fija. Así se puede contar.</p>
        <Select label="Motivo de caída" v={motivo} />
      </motion.div>
      <motion.div {...stagger(2)} className="bg-surface rounded-lg border border-line p-4">
        <div className="flex items-center gap-2"><Paso n="3" /><div className="font-semibold text-usil-deep text-[15px]">El tablero cuenta solo</div></div>
        <p className="text-[12.5px] text-ink2 m-0 mt-2">Una hoja de cálculo o un CRM gratuito agrupa por etapa y motivo. Para el asesor son dos clics más por llamada.</p>
        <div className="flex items-end gap-1.5 h-[62px] mt-3">
          {barras.map((h, k) => <motion.div key={k} className="flex-1 rounded-t bg-usil" initial={ini({ height: 0 })} whileInView={{ height: `${h}%` }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 + k * 0.08, ease: EASE }} />)}
        </div>
      </motion.div>
    </div>
  )
}

/* 5 · Limpieza de la base (ficticia). Mismas reglas que haría un script en Python o en Sheets: normalizar,
   validar, unir duplicados por correo y pasar el cargo en texto libre a un nivel. */
const nivel = cargo => !cargo.trim() ? 'Sin dato' : /gerent|direct/i.test(cargo) ? 'Gerencia' : /jef|coord|supervis/i.test(cargo) ? 'Jefatura' : 'Operativo'
const CARRERAS = [[/civil/i, 'Ingeniería Civil'], [/^adm/i, 'Administración'], [/enferm/i, 'Enfermería'], [/derech/i, 'Derecho']]
const titulo = s => s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/(^|\s)\p{L}/gu, c => c.toUpperCase())
const RAW = [
  { nombre: '  MARIA QUISPE ', carrera: 'ing civil', tel: '987654321', email: 'maria.quispe@gmail.com', cargo: '' },
  { nombre: 'María Quispe', carrera: 'Ingeniería Civil', tel: '+51 987 654 321', email: 'Maria.Quispe@gmail.com ', cargo: 'jefa de obra' },
  { nombre: 'jorge ramos', carrera: 'Adm.', tel: '01-4567890', email: 'jorge.ramos@', cargo: 'analista de compras' },
  { nombre: 'Lucía Fernández', carrera: 'enfermeria', tel: '912 345 678', email: 'lucia.f@hotmail.com', cargo: 'Coord. de enfermería' },
  { nombre: 'Diego Salazar', carrera: 'DERECHO', tel: '999888777', email: 'dsalazar@estudio.pe', cargo: 'Gerente Legal' },
]
const limpia = r => {
  const d = r.tel.replace(/\D/g, '').replace(/^51(?=9\d{8}$)/, '')
  const email = r.email.trim().toLowerCase()
  return {
    nombre: titulo(r.nombre), carrera: CARRERAS.find(([re]) => re.test(r.carrera))?.[1] ?? titulo(r.carrera),
    tel: /^9\d{8}$/.test(d) ? `+51 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : 'Revisar',
    email: /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(email) ? email : 'Revisar', cargo: r.cargo.trim(), nivel: nivel(r.cargo),
  }
}
// une duplicados por correo y completa los campos vacíos del primero con los del repetido
const LIMPIA = Object.values(RAW.map(limpia).reduce((m, r) => {
  const k = r.email === 'Revisar' ? r.nombre : r.email
  m[k] = m[k] ? Object.fromEntries(Object.entries(m[k]).map(([c, v]) => [c, v && v !== 'Sin dato' ? v : r[c]])) : r
  return m
}, {}))

function Limpieza() {
  const [modo, setModo] = useState('Antes')
  const antes = modo === 'Antes'
  const rows = antes ? RAW.map(r => ({ ...r, nivel: '—' })) : LIMPIA
  const revisar = LIMPIA.filter(r => r.tel === 'Revisar' || r.email === 'Revisar').length
  const mal = (c, v) => antes && ((c === 'nombre' && v !== titulo(v)) || (c === 'tel' && !/^9\d{8}$/.test(v)) || (c === 'email' && (v !== v.trim().toLowerCase() || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(v))) || (c === 'carrera' && !CARRERAS.some(([, n]) => n === v)))
  return (
    <Panel title="Paso 1: limpiar la base" aside={<Ficticio />}
      caption="Reglas: nombres con mayúscula inicial, carrera según una lista oficial, celular peruano de 9 dígitos, correo válido, duplicados unidos por correo y cargo pasado a nivel. En la práctica: Python (pandas) o fórmulas de Sheets.">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <Segmented value={modo} onChange={setModo} options={['Antes', 'Después']} small />
        <AnimatePresence mode="wait">
          <motion.span key={modo} initial={ini({ opacity: 0, x: -8 })} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-[12.5px] text-ink2">
            {antes ? `${RAW.length} filas tal como llegan de Word y Excel` : `${RAW.length} → ${LIMPIA.length} filas · ${RAW.length - LIMPIA.length} duplicado unido · ${revisar} por revisar a mano`}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full min-w-[720px] text-[12.5px] border-collapse">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-muted">{['Nombre', 'Carrera', 'Teléfono', 'Correo', 'Cargo', 'Nivel'].map(h => <th key={h} className="font-medium pb-2 pr-3">{h}</th>)}</tr></thead>
          <AnimatePresence mode="wait" initial={false}>
            <motion.tbody key={modo} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {rows.map((r, i) => (
                <motion.tr key={i} initial={ini({ opacity: 0, x: antes ? -12 : 12 })} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.06 }} className="border-t border-line">
                  {['nombre', 'carrera', 'tel', 'email', 'cargo', 'nivel'].map(c => (
                    <td key={c} className="py-2 pr-3">
                      <span className={`px-1.5 py-0.5 rounded whitespace-pre ${mal(c, r[c]) ? 'bg-gold-soft text-gold-ink' : !antes && r[c] === 'Revisar' ? 'bg-gold text-usil-deep font-semibold' : !antes && c === 'nivel' ? (/Jef|Ger/.test(r[c]) ? 'bg-usil-deep text-white' : 'bg-usil-wash text-usil-deep') : ''}`}>{r[c] || (antes ? '(vacío)' : '')}</span>
                    </td>
                  ))}
                </motion.tr>
              ))}
            </motion.tbody>
          </AnimatePresence>
        </table>
      </div>
    </Panel>
  )
}

/* De dónde sale el cargo: nadie lo adivina, se pide o se anota. */
const FUENTES_CARGO = [
  ['Lo dice la persona', 'Un campo "cargo actual" en el formulario de interés, en la postulación y en la actualización de datos de egresados (con un incentivo, como un webinar gratis).'],
  ['Lo anota el asesor', 'En la llamada pregunta "¿a qué te dedicas hoy?" y lo registra. Una pregunta más, un dato que sirve para siempre.'],
  ['Se revisa a mano, solo los mejores', 'Para los 20 o 30 de mayor puntaje, el asesor mira su perfil público de LinkedIn. A mano, sin scraping automático.'],
]
const EJEMPLOS_CARGO = ['Jefa de obra', 'Gerente Legal', 'Analista de compras', 'Coord. de enfermería', 'Asistente contable', 'Director comercial']
function Cargo() {
  const ejemplo = useRota(EJEMPLOS_CARGO, 2000)
  return (
    <Panel title="Paso 2: ¿cómo sé si tiene un cargo de jefatura?">
      <div className="flex flex-col gap-3">
        {FUENTES_CARGO.map(([t, d], i) => (
          <motion.div key={t} {...stagger(i)} className="flex gap-3">
            <Paso n={i + 1} />
            <div><div className="font-semibold text-[14px] text-usil-deep">{t}</div><p className="text-[12.5px] text-ink2 m-0">{d}</p></div>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 rounded-lg bg-bg px-4 py-3">
        <div className="text-[11px] uppercase tracking-wide text-muted mb-1.5">Texto libre → nivel, con palabras clave</div>
        <div className="flex items-center gap-2 text-[13.5px]">
          <span className="px-2 py-1 rounded bg-white border border-line min-w-[150px]"><Rota v={ejemplo} /></span>
          <span className="text-muted">→</span>
          <span className="px-2 py-1 rounded bg-usil-deep text-white font-semibold"><Rota v={nivel(ejemplo)} /></span>
        </div>
        <p className="text-[12px] text-muted m-0 mt-2">Si no hay dato, el puntaje no suma esos puntos. No se inventa nada.</p>
      </div>
    </Panel>
  )
}

/* Paso 3 · CRM v1 (ficticio). Puntaje por reglas visibles a propósito: el asesor entiende por qué alguien va primero. */
// ponytail: reglas fijas, no un modelo; con 6+ meses de embudo real se puede entrenar uno y comparar.
const AHORA = 2026
const LEADS = [
  ['María Quispe', 'Ing. Civil', 2018, 'Jefa de obra', true, false],
  ['Jorge Ramos', 'Administración', 2024, 'Analista', true, false],
  ['Lucía Fernández', 'Enfermería', 2016, 'Coordinadora de área', false, true],
  ['Diego Salazar', 'Derecho', 2012, 'Gerente legal', true, true],
  ['Valeria Torres', 'Economía', 2021, 'Analista financiera', true, true],
  ['Carlos Mendoza', 'Ing. de Sistemas', 2019, 'Jefe de TI', false, false],
  ['Andrea Castillo', 'Psicología', 2025, 'Asistente de RR. HH.', false, false],
  ['Renato Vargas', 'Contabilidad', 2014, 'Contador', true, false],
]
const AREA = { 'Ing. Civil': 'Gestión de proyectos', Administración: 'Gestión empresarial', Enfermería: 'Gestión en salud', Derecho: 'Derecho corporativo', Economía: 'Finanzas', 'Ing. de Sistemas': 'Datos e IA', Psicología: 'Talento y RR. HH.', Contabilidad: 'Finanzas' }
const FORMATO = { 'Recién egresado': 'Especialización', 'En crecimiento': 'Maestría', Senior: 'Alta dirección' }
const SEGMENTOS = ['Todos', ...Object.keys(FORMATO)]
const lead = ([nombre, carrera, egreso, cargo, abrio, pidio]) => {
  const anios = AHORA - egreso
  const seg = anios <= 2 ? 'Recién egresado' : anios < 10 ? 'En crecimiento' : 'Senior'
  const score = (anios >= 3 && anios <= 10 ? 30 : 10) + (/Jef|Ger/.test(nivel(cargo)) ? 25 : 0) + (abrio ? 25 : 0) + (pidio ? 20 : 0)
  return { nombre, carrera, egreso, cargo, seg, programa: `${FORMATO[seg]} · ${AREA[carrera]}`, score, accion: score >= 70 ? 'Llamar hoy' : score >= 40 ? 'WhatsApp con brochure' : 'Nutrir por correo' }
}

function Crm() {
  const [seg, setSeg] = useState('Todos')
  const rows = useMemo(() => LEADS.map(lead).filter(l => seg === 'Todos' || l.seg === seg).sort((a, b) => b.score - a.score), [seg])
  return (
    <Panel title="Paso 3: la lista priorizada del asesor" aside={<Ficticio />}
      caption="Puntaje = +30 egresó hace 3–10 años (si no, +10) · +25 nivel jefatura o gerencia · +25 abrió el último correo · +20 pidió información antes. El segmento sale de los años desde el egreso.">
      <div className="overflow-x-auto mb-3"><Segmented value={seg} onChange={setSeg} options={SEGMENTOS} small /></div>
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full min-w-[760px] text-[13px] border-collapse">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-muted">
            {['Interesado', 'Egreso', 'Segmento', 'Programa sugerido', 'Puntaje', 'Siguiente paso'].map(h => <th key={h} className="font-medium pb-2 pr-3">{h}</th>)}
          </tr></thead>
          <tbody>
            <AnimatePresence initial={false} mode="popLayout">
              {rows.map(l => (
                <motion.tr key={l.nombre} layout initial={ini({ opacity: 0, scale: 0.98 })} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3, ease: EASE }} className="border-t border-line hover:bg-usil-wash/50">
                  <td className="py-2.5 pr-3"><div className="font-semibold text-ink">{l.nombre}</div><div className="text-xs text-muted">{l.carrera} · {l.cargo}</div></td>
                  <td className="pr-3 num">{l.egreso}</td>
                  <td className="pr-3">{l.seg}</td>
                  <td className="pr-3">{l.programa}</td>
                  <td className="pr-3"><div className="flex items-center gap-2"><div className="w-20 h-2 rounded-full bg-line overflow-hidden"><motion.div className="h-full rounded-full" initial={ini({ width: 0 })} animate={{ width: `${l.score}%` }} transition={{ duration: 0.7, ease: EASE }} style={{ background: l.score >= 70 ? C.usil : l.score >= 40 ? C.usilT : C.compT }} /></div><span className="num">{l.score}</span></div></td>
                  <td className="pr-3"><span className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${l.score >= 70 ? 'bg-usil-deep text-white' : 'bg-usil-wash text-usil-deep'}`}>{l.accion}</span></td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

/* 6 · Matriz de portafolio (BCG, con nombres de cuadrante propios). Solo "Por validar" lleva hipótesis:
   son productos que la EPG no vende, así que su participación es 0 por definición. */
const BCG = [
  { t: 'Líder', d: 'Demanda creciendo · participación alta', gtm: 'Invertir: pauta pagada, landing propia, convenios con empresas.', chips: [] },
  { t: 'Por validar', d: 'Demanda creciendo · participación baja', gtm: 'Validar barato antes de invertir: webinar, preventa, piloto de una cohorte.', chips: ['IA en Salud', 'Mención en Datos e IA'], gold: true },
  { t: 'Consolidado', d: 'Demanda estable · participación alta', gtm: 'Rentabilizar: venta a exalumnos, referidos y poco gasto en pauta.', chips: [] },
  { t: 'Por replantear', d: 'Demanda estable · participación baja', gtm: 'Rediseñar o cerrar y mover el presupuesto a los que están por validar.', chips: [] },
]

const PLAN = [
  { m: 'Mes 1', items: ['Inventario de bases en Word y Excel', 'Base unificada y deduplicada', '3 plantillas por perfil, redactadas con IA'], hito: 'Lista priorizada para un asesor' },
  { m: 'Mes 2', items: ['Etapas y motivo de caída en Sheets o un CRM gratuito', 'Piloto con un asesor', 'Dashboard del embudo'], hito: 'Primera foto del embudo real' },
  { m: 'Mes 3', items: ['Reporte de la etapa más crítica con su acción', 'Segmentación por reglas para toda la base', 'Actualización del dashboard de competencia'], hito: 'Conversión del piloto frente al llamado masivo' },
]

function Propuesta() {
  const rows = ds.ALL
  const unis = ds.byUni(rows), mkt = ds.mercado(rows), prev = ds.puestoPrev(unis)
  const usil = unis.find(u => u.u === ds.USIL)
  const gs = ds.grupos(rows), brechas = gs.filter(g => !g.nUsil && g.k)
  const B = ds.BENCHMARK
  const activa = useActiva()
  const { scrollYProgress } = useScroll()

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 bg-usil-deep text-white">
        <div className="max-w-[1180px] mx-auto px-4 lg:px-10 py-2.5 flex items-center gap-4">
          <div className="bg-white rounded-md px-2 py-1 shrink-0"><img src={logo} alt="USIL" className="block h-7 w-auto" /></div>
          <nav className="flex-1 min-w-0 overflow-x-auto"><div className="flex gap-1 text-[13px] whitespace-nowrap">
            {NAV.map(([id, t]) => (
              <a key={id} href={`#${id}`} className={`relative px-2.5 py-1.5 rounded no-underline transition-colors ${activa === id ? 'text-usil-deep' : 'text-white/80 hover:bg-white/15 hover:text-white'}`}>
                {activa === id && <motion.span layoutId="nav-activa" className="absolute inset-0 rounded bg-gold" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                <span className="relative">{t}</span>
              </a>
            ))}
          </div></nav>
          <a href={DASH} className="hidden sm:inline-block shrink-0 px-3 py-1.5 rounded bg-white text-usil-deep text-[13px] font-semibold no-underline hover:bg-gold transition-colors">Abrir dashboard ↗</a>
        </div>
        <motion.div className="h-[3px] bg-gold origin-left" style={{ scaleX: scrollYProgress }} aria-hidden />
      </header>

      <main className="max-w-[1180px] mx-auto px-4 lg:px-10 py-10 overflow-x-clip">
        {/* Portada, con dos manchas de color que flotan detrás */}
        <div className="relative isolate">
          <div className="absolute -inset-x-10 -top-10 bottom-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
            <motion.div className="absolute -top-24 right-[-6%] w-[440px] h-[440px] rounded-full bg-usil-tint/60 blur-3xl" animate={ANIM ? { x: [0, -50, 0], y: [0, 40, 0] } : {}} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.div className="absolute top-24 right-[22%] w-[260px] h-[260px] rounded-full bg-gold-soft blur-3xl" animate={ANIM ? { x: [0, 40, 0], y: [0, -30, 0] } : {}} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }} />
          </div>
          <motion.div initial={ini({ opacity: 0, y: 12 })} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="text-[12px] uppercase tracking-wide text-usil font-semibold">Propuesta para la Escuela de Postgrado USIL</div>
            <h1 className="text-[36px] lg:text-[52px] leading-[1.05] text-usil-deep m-0 mt-2 max-w-[880px]">
              Del llamado masivo a una venta{' '}
              <span className="relative inline-block">guiada por datos
                <motion.span className="absolute left-0 right-0 bottom-1 h-3 -z-10 bg-gold origin-left rounded-sm" initial={ini({ scaleX: 0 })} animate={{ scaleX: 1 }} transition={{ duration: 0.9, delay: 0.5, ease: EASE }} />
              </span>
            </h1>
            <p className="text-[16px] text-ink2 m-0 mt-4 max-w-[760px]">Lo que puedo aportar como desarrollador: ordenar la data, medir dónde se pierde cada interesado y leer el mercado antes de lanzar un programa.</p>
            <p className="text-xs text-muted m-0 mt-3 mb-8">Alexis Portocarrero · {new Date(ds.FECHA).toLocaleDateString('es-PE', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</p>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-14">
            <Kpi label="Programas de posgrado analizados" value={mkt.total} sub={`${ds.UNIS.length} escuelas · catálogos públicos`} delay={0.3} />
            <Kpi label={`Prevalencia de IA en ${B}`} value={usil.pct} format={v => `${v.toFixed(1)}%`} sub={`${usil.ia} de ${usil.total} · ${prev.n}° de ${prev.k} comparables`} delay={0.4} />
            <Kpi label={`Tipos de programa IA que ${B} no tiene`} value={brechas.length} sub={`de ${gs.length} que vende el mercado`} delay={0.5} />
            <Kpi label="Costo en licencias" value="S/ 0" sub="Python · React · GitHub Pages" delay={0.6} />
          </div>
        </div>

        {/* 1 */}
        <SectionTitle id="diagnostico" n="1" sub="El proceso funciona, pero es lineal: no aprende de cada llamada y trata igual a un recién egresado que a un gerente.">Hoy se vende a todos por igual</SectionTitle>
        <div className="flex flex-col gap-4 mb-14">
          <div><div className="text-[11px] uppercase tracking-wide text-muted mb-2">Hoy</div><Flujo pasos={HOY} /></div>
          <div><div className="text-[11px] uppercase tracking-wide text-usil font-semibold mb-2">Propuesta</div><Flujo pasos={MANANA} bueno /></div>
        </div>

        {/* 2 */}
        <SectionTitle id="hecho" n="2" sub={`Sin acceso a datos internos, solo con información pública: el catálogo de ${ds.UNIS.length} escuelas de posgrado, qué programas tienen IA y dónde tiene huecos la ${B}.`}>Esto ya está hecho: lo que vende el mercado</SectionTitle>
        <div className="grid lg:grid-cols-[3fr_2fr] gap-4 mb-14">
          <Reveal minH={340}><Panel title="Programas con IA por escuela" caption={`Datos reales · catálogos públicos al ${ds.FECHA}.`}>
            <Legend items={[[C.usil, `${B} con IA`], [C.comp, 'Competidor con IA'], [C.compT, 'Sin IA']]} />
            <Prevalence data={unis} />
          </Panel></Reveal>
          <div className="flex flex-col gap-3 h-full">
            {ACCIONES.slice(0, 3).map((a, i) => (
              <motion.div key={a.title} initial={ini({ opacity: 0, x: 24 })} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.5, ease: EASE, delay: i * 0.12 }} whileHover={{ x: -4 }}
                className="bg-surface rounded-lg border border-line border-l-4 border-l-gold px-4 py-3 flex-1">
                <div className="text-[11px] uppercase tracking-wide text-usil font-semibold">Hallazgo {i + 1}</div>
                <div className="font-semibold text-[15px] text-usil-deep leading-snug">{a.title}</div>
                <p className="text-[12.5px] text-ink2 m-0 mt-1">{a.detail}</p>
              </motion.div>
            ))}
            <a href={DASH} className="text-center px-4 py-2.5 rounded-lg bg-usil-deep text-white text-[14px] font-semibold no-underline hover:bg-usil transition-colors">Ver el dashboard completo ↗</a>
          </div>
        </div>

        {/* 3 */}
        <SectionTitle id="frentes" n="3" sub="Los tres se apoyan: sin la base ordenada no hay embudo, y sin embudo ni matrícula interna no hay matriz de portafolio.">Tres frentes, en este orden</SectionTitle>
        <div className="grid lg:grid-cols-3 gap-4 mb-14">
          {FRENTES.map((f, i) => (
            <motion.section key={f.t} {...stagger(i)} whileHover={{ y: -6, boxShadow: '0 12px 28px rgba(0,47,108,.10)' }}
              className={`rounded-lg border p-5 flex flex-col gap-3 ${f.gold ? 'bg-surface border-line' : 'bg-bg border-dashed border-comp-tint'}`}>
              <div className="flex items-center justify-between"><span className="font-display text-4xl leading-none text-usil-tint">{f.n}</span><Tag gold={f.gold}>{f.tag}</Tag></div>
              <h3 className="text-[21px] m-0 text-usil-deep">{f.t}</h3>
              <p className="text-[13.5px] text-ink2 m-0">{f.que}</p>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted mb-1">Lo que entrego</div>
                <ul className="m-0 pl-4 text-[13px] flex flex-col gap-1">{f.entrego.map(e => <li key={e}>{e}</li>)}</ul>
              </div>
              <div className="mt-auto pt-3 border-t border-line text-[12.5px]"><span className="text-muted">Indicador · </span><span className="font-semibold text-usil-deep">{f.kpi}</span></div>
            </motion.section>
          ))}
        </div>

        {/* 4 */}
        <SectionTitle id="embudo" n="4" sub="Cada etapa tiene su propia tasa de caída y sus propios motivos. Atacar la etapa que más pierde rinde más que llamar a más gente.">Dónde se cae la gente y por qué</SectionTitle>
        <Reveal minH={480}><Embudo /></Reveal>
        <div className="text-[11px] uppercase tracking-wide text-usil font-semibold mt-8">¿De dónde salen estos números?</div>
        <div className="mb-14"><ComoSeMide /></div>

        {/* 5 */}
        <SectionTitle id="crm" n="5" sub="Tres pasos, en orden: limpiar lo que ya existe, completar el cargo y recién ahí ordenar a quién llamar. Con datos reales, esto viviría dentro de USIL y no en una página pública.">CRM v1: de la base desordenada a la lista del asesor</SectionTitle>
        <div className="grid lg:grid-cols-[3fr_2fr] gap-4 mb-4">
          <Reveal minH={380}><Limpieza /></Reveal>
          <Reveal minH={380} delay={0.1}><Cargo /></Reveal>
        </div>
        <Reveal minH={420} className="mb-14"><Crm /></Reveal>

        {/* 6 */}
        <SectionTitle id="vision" n="6" sub="Con la oferta del mercado (hecho), señales de demanda y la matrícula interna, cada programa cae en un cuadrante y recibe una estrategia de venta distinta.">Visión: una estrategia distinta por programa</SectionTitle>
        <Reveal minH={380} className="mb-14"><Panel title="Matriz de portafolio (BCG)" caption="Demanda = señales públicas (búsquedas, avisos de empleo, conversación profesional). Participación = matrícula de la EPG frente a la competencia; requiere la data interna del frente 1.">
          <div className="grid grid-cols-[22px_minmax(0,1fr)] gap-2">
            <div className="flex items-center justify-center"><span className="[writing-mode:vertical-rl] rotate-180 text-[12px] font-semibold text-usil-deep whitespace-nowrap">Crecimiento de la demanda ↑</span></div>
            <div>
              <div className="grid sm:grid-cols-2 gap-2">
                {BCG.map((q, i) => (
                  <motion.div key={q.t} initial={ini({ opacity: 0, scale: 0.92 })} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: EASE, delay: i * 0.12 }}
                    className={`rounded-lg p-4 ${q.gold ? 'bg-gold-soft' : 'bg-bg'}`}>
                    <div className="font-display text-[20px] font-semibold text-usil-deep">{q.t}</div>
                    <div className="text-[11.5px] text-muted mb-2">{q.d}</div>
                    <p className="text-[13px] text-ink m-0">{q.gtm}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {q.chips.length ? q.chips.map((c, k) => <motion.span key={c} animate={ANIM ? { y: [0, -3, 0] } : {}} transition={{ duration: 2.4, repeat: Infinity, delay: k * 0.4, ease: 'easeInOut' }} className="px-2 py-0.5 rounded-full bg-white border border-gold text-gold-ink text-[11.5px]">{c}</motion.span>)
                        : <span className="text-[11.5px] text-muted italic">Se llena con la matrícula interna</span>}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="text-center text-[12px] font-semibold text-usil-deep mt-2">← Participación de la EPG alta · baja →</div>
            </div>
          </div>
        </Panel></Reveal>

        {/* 7 */}
        <SectionTitle id="plan" n="7" sub="Alcance realista para un desarrollador junior: herramientas gratuitas, un piloto chico y resultados medibles antes de escalar.">Plan de 90 días</SectionTitle>
        {/* línea de tiempo que se dibuja al llegar */}
        <div className="hidden lg:block relative h-5 mb-2" aria-hidden>
          <motion.div className="absolute left-[16.6%] right-[16.6%] top-1/2 h-0.5 -translate-y-1/2 bg-usil-tint origin-left" initial={ini({ scaleX: 0 })} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, ease: EASE }} />
          {[16.6, 50, 83.4].map((x, i) => <motion.span key={x} className="absolute top-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-usil-deep border-[3px] border-gold" style={{ left: `${x}%` }} initial={ini({ scale: 0 })} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.2 + i * 0.4 }} />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-4 mb-4">
          {PLAN.map((p, i) => (
            <motion.section key={p.m} {...stagger(i)} className="bg-surface rounded-lg border border-line p-5 flex flex-col gap-3">
              <div className="font-display text-[22px] font-semibold text-usil-deep">{p.m}</div>
              <ul className="m-0 pl-4 text-[13.5px] flex flex-col gap-1">{p.items.map(t => <li key={t}>{t}</li>)}</ul>
              <div className="mt-auto rounded-md bg-usil-wash px-3 py-2 text-[12.5px]"><span className="text-muted">Hito · </span><span className="font-semibold text-usil-deep">{p.hito}</span></div>
            </motion.section>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-4 mb-12">
          <Reveal minH={160}><Panel title="Lo que necesito">
            <ul className="m-0 pl-4 text-[14px] flex flex-col gap-1.5 pb-1">
              <li>Acceso a las bases actuales de egresados e interesados</li>
              <li>Un asesor dispuesto a hacer el piloto</li>
              <li>30 minutos a la semana con alguien del área</li>
            </ul>
          </Panel></Reveal>
          <Reveal minH={160} delay={0.1}><Panel title="Cuidado de los datos">
            <p className="text-[14px] text-ink2 m-0 pb-1">Los datos personales se trabajan dentro de USIL y con consentimiento, según la Ley 29733. Nada de eso se publica en una página como esta: aquí todo es información pública o ficticia.</p>
          </Panel></Reveal>
        </div>

        <footer className="text-xs text-muted pb-8">Alexis Portocarrero · Competencia: catálogos públicos al {ds.FECHA} · Limpieza, embudo y CRM: datos ficticios para ilustrar</footer>
      </main>
    </div>
  )
}

// reducedMotion="user": quien tiene "reducir movimiento" en su sistema ve la página sin desplazamientos
createRoot(document.getElementById('root')).render(<StrictMode><MotionConfig reducedMotion="user"><Propuesta /></MotionConfig></StrictMode>)
