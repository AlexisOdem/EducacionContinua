# -*- coding: utf-8 -*-
"""Piezas compartidas por build_data.py (educación continua) y build_segment.py (institutos y posgrado):
normalización de texto, las 17 líneas de carrera con su clasificador por palabras clave, horas y precio de lista.
Un solo clasificador para los tres segmentos: si cambia una palabra clave, cambia en todos.
"""
import re, unicodedata


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
OTROS = 'IA transversal / Otros'
NOMBRES = [l for l, _ in LINEAS] + [OTROS]

IA_KW = ['inteligencia artificial', ' ia ', 'ia:', 'ia ', ' ia', 'chatgpt', 'ia generativa', 'generativa', 'prompt', 'copilot', 'llm', 'machine learning', 'deep learning', 'agentes']


def clasificar(nombre, categoria):
    """Línea de carrera por palabras clave del nombre (peso 2) y de la categoría del sitio (peso 1).
    Las palabras de IA se borran del nombre para que un curso de 'IA para X' caiga en la línea X."""
    nom = ' ' + norm(nombre) + ' '; cat = ' ' + norm(categoria) + ' '
    if 'inteligencia artificial' in cat: cat = ' '  # facultad mixta USIL 'Ingeniería e IA'
    for k in IA_KW: nom = nom.replace(k, ' ')
    best, bestscore = None, 0
    for linea, kws in LINEAS:
        score = sum(2 for k in kws if k in nom) + sum(1 for k in kws if k in cat)
        if score > bestscore: best, bestscore = linea, score
    return best or OTROS


def horas(txt):
    m = re.search(r'(\d+)\s*horas', norm(txt))
    return int(m.group(1)) if m else None


def precio_lista(txt):
    """Precio de lista = mayor monto citado (público general, sin pronto pago)."""
    if not txt: return None
    nums = [float(n.replace(',', '')) for n in re.findall(r'(\d[\d,]*\.?\d*)', txt)]
    nums = [n for n in nums if n >= 50]
    if not nums: return None
    m = re.search(r'(\d+(?:\.\d+)?)\s*%\s*desc', txt, re.I)  # 'S/ 1,260 (30% desc.)' -> precio de lista 1,800
    return round(max(nums) / (1 - float(m.group(1)) / 100)) if m else max(nums)
