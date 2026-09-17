# -*- coding: utf-8 -*-
"""Lee 00_Data/raw/programas_*.json y escribe app/src/data.json (todas las filas
con línea, tipo, grupo de curso IA, precio y horas). Los agregados se calculan en el cliente.
Correr: python app/scripts/build_data.py
"""
import json, glob, re, os, collections, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comun import norm, LINEAS, OTROS, NOMBRES, clasificar, horas, precio_lista  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'app', 'src', 'data.json')

# ponytail: ranking fijo; cambiar aquí si el decano prefiere otra fuente.
RANKING = {'PUCP': 15, 'ULima': 94, 'UPC': 107, 'USIL': 120, 'Continental': 401, 'UTEC': None}  # 401 = banda 401+
RANKING_FUENTE = 'QS World University Rankings: Latin America & The Caribbean 2026'
UNIS = ['USIL', 'UPC', 'PUCP', 'ULima', 'UTEC', 'Continental']

# ---------- grupos de cursos IA similares (curado en scripts/grupos_ia.json: {"groups":[{"name","urls"}]}) ----------
GRUPOS_PATH = os.path.join(ROOT, 'app', 'scripts', 'grupos_ia.json')
GRUPO_DE = {url: g['name'] for g in json.load(open(GRUPOS_PATH, encoding='utf-8'))['groups'] for url in g['urls']} if os.path.exists(GRUPOS_PATH) else {}

# ---------- tipo de curso ----------
LARGO = 'Especialización y diplomado'

def tipo(r, h):
    tp = norm(r.get('tipo_programa')); n = norm(r['nombre'])
    if 'diplom' in tp or 'diplom' in n: return LARGO
    if tp in ('especializacion', 'programa especializado'): return LARGO
    if tp in ('curso', 'taller', 'cursos teens', 'silver age', 'summer programs', 'winter programs', 'curso de especializacion', 'certificacion digital'): return 'Curso corto'
    if any(k in n for k in ['programa de especializacion', 'programa especializado', 'especializacion', 'programa ejecutivo', 'certificacion', 'pdp ', 'pdp-', 'ecpro', 'cfu']): return LARGO
    if h and h >= 100: return LARGO  # ponytail: umbral por horas; ajustar si el decano define otro corte
    return 'Curso corto'

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
        g=GRUPO_DE.get(r.get('url')) if ia else None,
        m=r.get('modalidad'), d=r.get('duracion'), url=r.get('url'),
    ))

data = dict(fecha='2026-09-09', ranking=RANKING, ranking_fuente=RANKING_FUENTE, unis=UNIS,
            lineas=[l for l, _ in LINEAS] + ['IA transversal / Otros'], tipos=['Curso corto', LARGO], rows=out)
json.dump(data, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

if __name__ == '__main__':
    assert precio_lista('S/ 320 (comunidad) / S/ 400 (público)') == 400
    assert precio_lista('S/ 1,260 (30% desc.)') == 1800
    assert horas('16 semanas (128 horas)') == 128
    assert clasificar('IA para la Gestión del Talento', '') == 'Talento y RRHH'
    assert tipo({'tipo_programa': 'Curso de Especialización', 'nombre': 'x'}, 24) == 'Curso corto'
    print('OK ->', OUT, len(out), 'filas')
    sin_grupo = [r['n'] for r in out if r['ia'] and not r['g']]
    print('Cursos IA sin grupo:', len(sin_grupo), sin_grupo[:5])
    print('Tipos:', collections.Counter(r['t'] for r in out))
