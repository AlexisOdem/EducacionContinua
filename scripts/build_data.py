# -*- coding: utf-8 -*-
"""Lee 00_Data/raw/programas_*.json y escribe app/src/data.json (todas las filas
con línea, tipo, tema, precio y horas). Los agregados se calculan en el cliente.
Correr: python app/scripts/build_data.py
"""
import json, glob, re, unicodedata, os, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'app', 'src', 'data.json')

# ponytail: ranking fijo; cambiar aquí si el decano prefiere otra fuente.
RANKING = {'PUCP': 15, 'ULima': 94, 'UPC': 107, 'USIL': 120, 'Continental': 401, 'UTEC': None}  # 401 = banda 401+
RANKING_FUENTE = 'QS World University Rankings: Latin America & The Caribbean 2026'
UNIS = ['USIL', 'UPC', 'PUCP', 'ULima', 'UTEC', 'Continental']

def norm(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().lower()
    return re.sub(r'\s+', ' ', s)

# ---------- líneas de carrera (orden = desempate) ----------
LINEAS = [
    ('Hotelería, Gastronomía y Alimentos', ['hotel', 'turism', 'gastronom', 'cocina', 'pastel', 'reposter', 'panader', 'sommelier', 'bartend', 'coctel', 'restaurant', 'chef', 'barista', 'cafe ', 'vino', 'inocuidad', 'haccp', 'alimentari', 'alimentos']),
    ('Talento y RRHH', ['recursos humanos', 'rrhh', 'talento', 'capital humano', 'compensacion', 'seleccion', 'clima', 'coaching', 'organizacional', 'cultura', 'bienestar', 'people']),
    ('Salud', ['salud', 'medic', 'enfermer', 'clinic', 'nutricion', 'farmac', 'odont', 'hospital', 'paciente', 'fisioterap', 'veterinar', 'sanitari', 'psicolog', 'terap', 'quirurg', 'obstet', 'geriatr', 'ecograf', 'estetica']),
    ('Educación', ['educacion', 'educativ', 'docente', 'docencia', 'pedagog', 'aula', 'ensenanza', 'aprendizaje', 'tutor', 'curricul', 'recursos educativos', 'escolar', 'neuroeduc', 'ninos', 'infantil']),
    ('Derecho y Cumplimiento', ['derecho', 'legal', 'juridic', 'compliance', 'contrataciones', 'arbitraje', 'penal', 'derecho civil', 'codigo civil', 'responsabilidad civil', 'procesal civil', 'notarial', 'registral', 'propiedad intelectual', 'contratos', 'litig', 'procesal', 'laboral', 'abogado', 'ley ', 'pena', 'regulator', 'etica', 'judicial', 'plenario']),
    ('Arquitectura, Construcción e Ingeniería', ['arquitect', 'construccion', 'bim', 'revit', 'autocad', 'obra', 'edificac', 'urbanis', 'inmobiliari', 'ingenieria', 'miner', 'energia', 'electric', 'mecanic', 'ambiental', 'medio ambiente', 'saneamiento', 'topograf', 'geotec', 'estructur', 'sso', 'seguridad y salud', 'tasacion', 'perit', 'interiores', 'paisaj', 'ingenieros', 'ccna', 'switching']),
    ('Marketing y Ventas', ['marketing', 'venta', 'comercial', 'branding', 'marca', 'redes sociales', 'social media', 'commerce', 'publicidad', 'growth', 'customer', 'cliente', 'crm', 'trade', 'retail', 'consumidor', 'seo', 'sem ', 'influencer', 'tiktok', 'instagram']),
    ('Datos y Analítica', ['datos', 'data', 'analytic', 'analitica', 'power bi', 'tableau', 'sql', 'estadistic', 'machine learning', 'big data', 'business intelligence', 'excel', 'dashboard', 'investigacion', 'hojas calculo', 'hojas de calculo', 'looker', 'sheets', 'power automate', 'solver', 'montecarlo', 'crystal ball', 'mercado']),
    ('Tecnología y Software', ['software', 'programacion', 'desarrollo web', 'cloud', 'devops', 'ciber', 'redes', 'sistemas', 'automatizacion', 'rpa', 'no code', 'low code', 'java', 'python', 'aws', 'azure', 'blockchain', 'iot', 'tecnolog', 'digital', 'app', 'informatic', 'ti ', 'hacking', 'linux', 'sap', 'erp', 'videojuego', 'robot', 'drone', 'dron']),
    ('Finanzas y Contabilidad', ['finanz', 'financier', 'contab', 'tributa', 'costos', 'presupuesto', 'inversion', 'banca', 'riesgo', 'niif', 'tesoreria', 'credit', 'cobranz', 'bolsa', 'trading', 'valoriz', 'auditor', 'impuesto', 'planilla']),
    ('Operaciones y Logística', ['logistic', 'supply', 'cadena de suministro', 'operacion', 'almacen', 'compras', 'abastec', 'lean', 'calidad', 'six sigma', 'produccion', 'mantenimiento', 'procesos', 'aduan', 'comercio exterior', 'exportac', 'importac', 'transporte', 'flota', 'iso 9001', 'iso ', 'invierte', 'patrimonial']),
    ('Proyectos y Agilidad', ['proyecto', 'pmp', 'pmi', 'project', 'scrum', 'agil', 'kanban', 'product owner', 'pmo']),
    ('Gestión Pública', ['gestion publica', 'publico', 'estado', 'municipal', 'siaf', 'osce', 'gubernamental', 'politica', 'gobierno']),
    ('Comunicación y Diseño', ['comunicacion', 'diseno', 'ux', 'ui ', 'audiovisual', 'fotograf', 'video', 'periodis', 'locucion', 'storytelling', 'contenido', 'creativ', 'ilustracion', 'animacion', 'edicion', 'guion', 'podcast', 'produccion musical', 'musica', 'arte', 'moda', 'premier', 'presentaciones', 'prezi', 'canva', 'powtoon', 'teatro']),
    ('Idiomas y Habilidades', ['ingles', 'idioma', 'portugues', 'frances', 'italiano', 'chino', 'habilidades blandas', 'oratoria', 'inteligencia emocional', 'negociacion', 'comunicacion efectiva', 'hablar en publico', 'escritura', 'redaccion', 'ortograf', 'estudios', 'conversacional', 'power skills', 'guerras', 'historia']),
    ('Gestión y Negocios', ['gestion empresarial', 'administracion', 'estrategi', 'liderazgo', 'negocio', 'emprend', 'innovacion', 'gerenc', 'directiv', 'transformacion digital', 'empresa', 'mba', 'startup', 'sostenib', 'esg', 'gobierno corporativo', 'management', 'productividad', 'innovation', 'business', 'catalyst', 'toolkit', 'esb', 'ecba', 'iiba']),
]
IA_KW = ['inteligencia artificial', ' ia ', 'ia:', 'ia ', ' ia', 'chatgpt', 'ia generativa', 'generativa', 'prompt', 'copilot', 'llm', 'machine learning', 'deep learning', 'agentes']

def clasificar(nombre, categoria):
    nom = ' ' + norm(nombre) + ' '; cat = ' ' + norm(categoria) + ' '
    if 'inteligencia artificial' in cat: cat = ' '  # facultad mixta USIL 'Ingeniería e IA'
    for k in IA_KW: nom = nom.replace(k, ' ')
    best, bestscore = None, 0
    for linea, kws in LINEAS:
        score = sum(2 for k in kws if k in nom) + sum(1 for k in kws if k in cat)
        if score > bestscore: best, bestscore = linea, score
    return best or 'IA transversal / Otros'

# ---------- temas (para la lista de brechas) ----------
TEMAS = [
    ('Agentes y chatbots', ['agente', 'chatbot', 'asistente virtual', ' bot']),
    ('Visión computacional', ['vision', 'imagen', 'opencv']),
    ('Automatización y no-code', ['automatiz', 'no code', 'low code', 'rpa', 'n8n', 'zapier', 'power automate', 'flujos']),
    ('Ciberseguridad', ['ciber', 'seguridad informatica', 'hacking', 'security']),
    ('Ética y gobernanza de IA', ['etica', 'gobernanza', 'regulacion', 'responsable', 'riesgos de la ia']),
    ('Desarrollo de software y cloud', ['desarrollo de aplicaciones', 'programacion', 'software', 'python', 'cloud', 'arquitectura digital', 'developer', 'databricks', 'ingenieria de datos']),
    ('Machine learning', ['machine learning', 'aprendizaje automatico', 'deep learning', 'predictiv', 'modelos']),
    ('Salud', ['salud', 'clinic', 'medic', 'telesalud', 'psicolog', 'diagnostic']),
    ('Derecho y protección de datos', ['derecho', 'legal', 'juridic', 'abogado', 'compliance', 'proteccion de datos', 'privacidad']),
    ('Educación', ['docente', 'educacion', 'educativ', 'aprendizaje', 'ensenanza', 'clases']),
    ('Talento y RRHH', ['talento', 'rrhh', 'recursos humanos', 'compensacion', 'people']),
    ('Finanzas e inversiones', ['finanz', 'inversion', 'fintech', 'credit', 'contab', 'tributa', 'banca']),
    ('Proyectos y agilidad', ['proyecto', 'agil', 'scrum', 'pmo']),
    ('Gestión pública', ['publica', 'estado', 'gobierno', 'ciencias sociales']),
    ('Ingeniería, minería y construcción', ['ingenier', 'miner', 'bim', 'construccion', 'arquitect', 'urbanismo', 'tasacion']),
    ('Diseño y UX', ['diseno', 'ux', ' ui', 'grafico', 'creativ']),
    ('Logística y operaciones', ['logistic', 'supply', 'operacion', 'cadena', 'compras']),
    ('Marketing, ventas y contenidos', ['marketing', 'venta', 'comercial', 'contenido', 'redes sociales', 'growth', 'comunicacion']),
    ('Datos y analítica', ['datos', 'data', 'analitica', 'analytics', 'power bi', 'excel', 'dashboard']),
    ('Hotelería y turismo', ['hotel', 'turism', 'restaurant', 'gastronom']),
    ('Liderazgo y negocios', ['lider', 'negocio', 'estrategi', 'innovacion', 'chief', 'directiv', 'gerenc', 'emprend', 'transformacion', 'empresa', 'business', 'productividad', 'toolkit']),
    ('IA generativa y prompts', ['prompt', 'generativa', 'chatgpt', 'copilot', 'herramientas de ia', 'aplicaciones y herramientas', 'introduccion']),
]
def tema(nombre, sumilla):
    nom = ' ' + norm(nombre) + ' '; sm = ' ' + norm(sumilla) + ' '
    best, bestscore = 'IA generativa y prompts', 0
    for t, kws in TEMAS:
        score = sum(3 for k in kws if k in nom) + sum(1 for k in kws if k in sm)
        if score > bestscore: best, bestscore = t, score
    return best

# ---------- tipo de curso ----------
def horas(txt):
    m = re.search(r'(\d+)\s*horas', norm(txt))
    return int(m.group(1)) if m else None

def tipo(r, h):
    tp = norm(r.get('tipo_programa')); n = norm(r['nombre'])
    if 'diplom' in tp or 'diplom' in n: return 'Diplomado'
    if tp in ('especializacion', 'programa especializado'): return 'Especialización'
    if tp in ('curso', 'taller', 'cursos teens', 'silver age', 'summer programs', 'winter programs', 'curso de especializacion', 'certificacion digital'): return 'Curso corto'
    if any(k in n for k in ['programa de especializacion', 'programa especializado', 'especializacion', 'programa ejecutivo', 'certificacion', 'pdp ', 'pdp-', 'ecpro', 'cfu']): return 'Especialización'
    if h and h >= 100: return 'Especialización'  # ponytail: umbral por horas; ajustar si el decano define otro corte
    return 'Curso corto'

def precio_lista(txt):
    """Precio de lista = mayor monto citado (público general, sin pronto pago)."""
    if not txt: return None
    nums = [float(n.replace(',', '')) for n in re.findall(r'(\d[\d,]*\.?\d*)', txt)]
    nums = [n for n in nums if n >= 50]
    return max(nums) if nums else None

# ---------- carga ----------
rows = []
for f in sorted(glob.glob(os.path.join(ROOT, '00_Data', 'raw', 'programas_*.json'))):
    rows += json.load(open(f, encoding='utf-8'))
rows = [r for r in rows if 'pdp-metodologia-investigacion' not in (r.get('url') or '')]  # posgrado disfrazado

out = []
for r in rows:
    h = horas(r.get('duracion')); p = precio_lista(r.get('precio_texto')); ia = bool(r.get('es_candidato_ia'))
    out.append(dict(
        u=r['universidad'], n=r['nombre'], l=clasificar(r.get('nombre'), r.get('categoria_nativa_sitio')),
        t=tipo(r, h), ia=ia, p=p, h=h, ph=round(p / h) if p and h else None,
        tema=tema(r['nombre'], r.get('sumilla')) if ia else None,
        m=r.get('modalidad'), d=r.get('duracion'), url=r.get('url'),
    ))

data = dict(fecha='2026-09-09', ranking=RANKING, ranking_fuente=RANKING_FUENTE, unis=UNIS,
            lineas=[l for l, _ in LINEAS] + ['IA transversal / Otros'], tipos=['Curso corto', 'Especialización', 'Diplomado'], rows=out)
json.dump(data, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

if __name__ == '__main__':
    assert precio_lista('S/ 320 (comunidad) / S/ 400 (público)') == 400
    assert horas('16 semanas (128 horas)') == 128
    assert clasificar('IA para la Gestión del Talento', '') == 'Talento y RRHH'
    assert tipo({'tipo_programa': 'Curso de Especialización', 'nombre': 'x'}, 24) == 'Curso corto'
    print('OK ->', OUT, len(out), 'filas')
    usil_temas = {r['tema'] for r in out if r['u'] == 'USIL' and r['ia']}
    print('Temas USIL:', sorted(usil_temas))
    gaps = [r for r in out if r['ia'] and r['u'] != 'USIL' and r['tema'] not in usil_temas]
    print('Brechas:', len(gaps))
    for t, g in sorted(collections.Counter(r['tema'] for r in gaps).items(), key=lambda x: -x[1]): print(f'  {t}: {g}')
    for r in gaps: print('   ', r['tema'][:22].ljust(22), r['u'].ljust(11), (r['p'] or 0), r['n'][:70])
