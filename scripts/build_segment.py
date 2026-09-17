# -*- coding: utf-8 -*-
"""Genera los datos de los segmentos nuevos del dashboard, con el mismo esquema de filas que data.json:

    python app/scripts/build_segment.py            # los dos
    python app/scripts/build_segment.py institutos

Lee  Institutos/00_Data/processed/programas_*.json  ->  app/src/data_institutos.json
     Posgrado/00_Data/processed/programas_*.json    ->  app/src/data_posgrado.json

Fila: u, n, l, t, ia, p, h, ph, g, m, d, url  (igual que educación continua)
      + id  identificador estable "institucion#indice" (ni la url ni el nombre son únicos:
            USIL EPG repite la url de la categoría en sus 53 programas de educación ejecutiva)
      + nv  nivel/tipo nativo tal cual lo publica la institución (para el tooltip)
      + agg true si la fila es una categoría o un área que agrupa varios programas

Los agregados se calculan en el cliente (src/stats.js), igual que en educación continua.
"""
import json, glob, os, re, sys, collections

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comun import NOMBRES, clasificar, horas, precio_lista  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FECHA = '2026-09-15'

# ---------- correcciones manuales a la marca de IA (revisión curso por curso al curar los grupos) ----------
# La marca es_candidato_ia del crawl es un candidato, no un veredicto. Regla aplicada:
# se mantiene si el nombre o la sumilla presentan la IA como contenido del programa (herramienta, módulo o
# resultado de aprendizaje); se quita si la IA solo aparece como adorno del copy de un curso de otro tema,
# o si la evidencia está copiada de otro registro. Cada cambio queda documentado aquí y en el README.
SIN_IA = {
    # Toulouse · el único rastro de IA es la cola de la meta description ("proyectos sostenibles con IA")
    # en un curso de jardinería y paisajismo: no hay módulo, herramienta ni resultado de IA.
    'https://www.toulouselautrec.edu.pe/cursos/diseno-jardines-paisajismo': 'IA solo decorativa en la meta description de un curso de paisajismo',
    # Toulouse · el crawl le copió nombre y sumilla al curso de Data Science; por el slug es Big Data &
    # Business Intelligence. Se renombra (ver RENOMBRES) y se le quita la marca: la evidencia no es suya.
    'https://www.toulouselautrec.edu.pe/cursos/big-data-business-intelligence': 'evidencia duplicada del curso de Data Science; el programa es Big Data & BI',
}
RENOMBRES = {
    'https://www.toulouselautrec.edu.pe/cursos/big-data-business-intelligence': 'Curso de Big Data & Business Intelligence',
}
# Nombres que el crawl no pudo extraer (placeholder de la plantilla o vacío): se derivan del slug.
GENERICOS = {'nuestros cursos', 'nuestros programas', ''}


def del_slug(url):
    s = re.sub(r'[?#].*$', '', url or '').rstrip('/').rsplit('/', 1)[-1]
    return re.sub(r'-', ' ', s).strip().title()


# ---------- segmentos ----------
INSTITUTOS = dict(
    key='institutos', dir='Institutos', fecha=FECHA,
    titulo='Institutos', benchmark='USIL IE',
    benchmark_largo='Instituto de Emprendedores de USIL',
    # nombre corto -> archivo (USIL primero: fija el orden de columnas y el color de la marca)
    unis=[('USIL IE', 'usil_instituto_emprendedores'), ('Cibertec', 'cibertec'), ('Toulouse', 'toulouse'),
          ('ISIL', 'isil'), ('SENATI', 'senati'), ('TECSUP', 'tecsup')],
    tipos=['Curso corto', 'Programa', 'Diplomado', 'Certificación'],
    corto='Curso corto', largo=['Programa', 'Diplomado', 'Certificación'],
    # tipo nativo (minúsculas) -> tipo del filtro
    tipo_de={
        'curso corto': 'Curso corto', 'curso': 'Curso corto', 'curso de especialización': 'Curso corto',
        'curso / programa de extensión': 'Curso corto',
        'programa': 'Programa', 'programa internacional': 'Programa',
        'programa modular / de actualización': 'Programa',
        'diplomado': 'Diplomado',
        'certificación': 'Certificación', 'certificación internacional': 'Certificación',
        # TECSUP (taxonomía nativa 'tipo_programa' de su wp-json; ver NOTAS)
        'curso corto': 'Curso corto',
        'escuela de operadores': 'Curso corto',
        'programa integral': 'Programa',
        'programa de especialización': 'Diplomado',
        'educación continua': 'Curso corto', 'centro de seguridad': 'Curso corto',
        'eduverso': 'Curso corto', 'seminario': 'Curso corto',
    },
    excluir_nv=(),  # institutos: ninguna fila se descarta
    no_comparable=(),
)

POSGRADO = dict(
    key='posgrado', dir='Posgrado', fecha=FECHA,
    titulo='Posgrado', benchmark='USIL EPG',
    benchmark_largo='Escuela de Postgrado de USIL',
    unis=[('USIL EPG', 'usil_epg'), ('UPC', 'upc'), ('CENTRUM', 'centrum'),
          ('ESAN', 'esan'), ('U. Pacífico', 'up'), ('UTP', 'utp')],
    tipos=['Educación ejecutiva', 'Maestría y MBA', 'Doctorado'],
    corto='Educación ejecutiva', largo=['Maestría y MBA', 'Doctorado'],
    tipo_de={
        'programa de educación ejecutiva': 'Educación ejecutiva',
        'programa especializado (educación ejecutiva)': 'Educación ejecutiva',
        'programa/curso de especialización (pee - sector público)': 'Educación ejecutiva',
        'curso (egp)': 'Educación ejecutiva',
        'programa de especialización (egp - gestión pública)': 'Educación ejecutiva',
        'programa de especialización (egp - derecho)': 'Educación ejecutiva',
        'programa especializado': 'Educación ejecutiva', 'curso de especialización': 'Educación ejecutiva',
        'diplomado': 'Educación ejecutiva', 'diploma de especialización': 'Educación ejecutiva',
        'maestría': 'Maestría y MBA', 'mba': 'Maestría y MBA', 'maestría (sede arequipa)': 'Maestría y MBA',
        'doctorado': 'Doctorado',
    },
    # nivel nativo (en minúsculas) que se descarta del dataset por completo: las 10 áreas temáticas de ESAN
    # agrupan varios programas y no son oferta en sí misma, ni cuentan como programa ni entran a ningún gráfico.
    # y las 10 segundas especialidades (UTP 8, UPC 2): nivel marginal, sin IA, que solo fragmentaba los gráficos.
    excluir_nv=('área temática (agrupa varios pee/diplomas)', 'segunda especialidad'),
    # el agregado ya no es por institución: cada fila trae su propio 'es_categoria' (ver programas_upc.json).
    no_comparable=(),
)

NOTAS = {
    'institutos': [
        ['TECSUP', 'Reverificado: el HTML estático (y el renderizado en headless) mostraba placeholder Lorem Ipsum, pero el REST API pública de WordPress (wp-json/wp/v2/cursos) sí expone el contenido real. Se recapturaron sus 174 cursos vigentes desde esa API (antes 168 con nombre derivado del slug): nombre, tipo (taxonomía tipo_programa), categoría (área formativa), precio, duración, horario, fecha de inicio y descripción oficial. Candidatos IA subieron de 1 a 5 al poder leer el nombre y la descripción corta reales en vez del placeholder. Reverificación ronda 3: TECSUP no publica meta description (sin Yoast); de los 5 candidatos solo 1 tiene "IA" en el h1/URL (Diseña tu StartUp con IA). De los otros 4, se aplicó el criterio "IA como contenido central del curso, no mención de paso": se conservó Desarrollo Web Java con Vibe Coding (la IA define la metodología del curso) y se quitaron los otros 3 (Planner de Mantenimiento, PMBOK y Power BI), donde la IA es una cláusula adicional en un temario de otro tema. Detalle curso por curso en Institutos/01_Logs/crawl_log.json → reverificacion_2026-09-16_ronda3. TECSUP queda en 2 de 174 con IA.'],
        ['USIL IE', 'Catálogo reverificado de 17 programas (antes 11): de los 6 nuevos, 1 (Automatización de Tareas Administrativas con IA) estaba oculto del sitemap por ser "noindex" pero vive en el sitio principal, y los otros 5 solo existen como brochure en files.usil.edu.pe, sin página propia activa hoy. De los 6 cursos con IA del IE, 4 tienen confianza alta (página en vivo: Generación de Contenidos con IA y CapCut, Business Intelligence con Power BI e IA, Certificación en IA y Automatización de Tareas con IA) y 2 confianza media (solo brochure PDF, página propia caída: IA Generativa para la Productividad e IA Aplicada a las Redes Sociales); confirmar vigencia de estas 2 con el instituto antes de tratarlas como oferta activa garantizada.'],
        ['Toulouse', 'De sus 10 candidatos IA se quitaron 2: un curso de paisajismo con IA solo en el copy y un duplicado del curso de Data Science (renombrado a Big Data & BI).'],
        ['Precio', 'Solo ISIL (91 de 91), SENATI (13 de 33) y TECSUP (174 de 174) publican precio. Sin sección de precio en este segmento.'],
        ['Sumillas', 'Cibertec, ISIL, Toulouse y TECSUP (173 de 174) traen sumilla; SENATI solo 3. Los grupos de cursos IA se curaron a mano.'],
        ['Líneas', 'La línea de carrera sale del mismo clasificador por palabras clave de educación continua, sin validación manual.'],
    ],
    'posgrado': [
        ['UPC Postgrado', 'Reverificado: sus 45 categorías se desglosaron en 311 programas individuales (h1/URL/meta de cada página). 5 categorías de maestría (Psicología, RRHH y Liderazgo, Dirección de la Comunicación Empresarial, Gestión y Desarrollo del Talento, Psicología de la Salud y Estilos de Vida) siguen sin desglosar por no tener página propia y quedan como categoría: van con marcador hueco y rayado solo esas 5 filas, el resto de UPC ya cuenta como programa y entra al puesto de prevalencia. Ronda 3: 2 de esas 5 categorías (Dirección de la Comunicación Empresarial, Gestión y Desarrollo del Talento) tenían marca IA sacada del cuerpo de su página de categoría -regla distinta al resto- y duplicaban temas ya desglosados; se les quitó la marca (ver Posgrado/01_Logs/crawl_log.json → reverificacion_2026-09-16_ronda3). Además, 24 de los 306 programas individuales de UPC no se pudieron verificar por bloqueo del WAF (403) y su nombre viene del slug de la URL, no del h1 real.'],
        ['Segundas especialidades', 'Las 10 segundas especialidades (UTP 8, UPC 2) quedan fuera del dataset: ninguna tiene IA y ninguna institución llega a 10 por separado.'],
        ['ESAN', 'Sus 10 "áreas temáticas" (p. ej. "Área de Marketing") agrupan varios programas y no son oferta en sí misma: se excluyeron del dataset y de todos los gráficos. El área de Marketing era el único indicio de IA de ESAN en ese tema; sin programas propios detrás, ESAN queda sin evidencia de IA en Marketing en este dato.'],
        ['CENTRUM', 'Reverificado: 29 registros que el crawl original clasificó como "Educación ejecutiva" eran en realidad doctorado, MBA o maestría, y se reclasificaron; se sumaron 3 programas vigentes no capturados antes. Las maestrías institucionales de PUCP siguen sin estar. 39 de sus 148 programas tienen el nombre derivado del slug de la URL, no del h1 de la página.'],
        ['U. Pacífico', 'Pacífico Business School se recapturó en su dominio correcto (pbs.edu.pe); el dominio usado en el crawl original ya no resuelve. Escuela de Gestión Pública sigue sesgando sus líneas hacia ese tema.'],
        ['Precio', 'Ninguna institución de posgrado publica precio. Sin sección de precio en este segmento.'],
        ['Líneas', 'Mismo clasificador por palabras clave de educación continua: "Competencias Digitales e IA Aplicada para Educadores" (USIL EPG) cae en Tecnología y Software, no en Educación.'],
    ],
}


def build(seg):
    grupos_path = os.path.join(ROOT, 'app', 'scripts', f'grupos_ia_{seg["key"]}.json')
    grupo_de = {}
    if os.path.exists(grupos_path):
        gj = json.load(open(grupos_path, encoding='utf-8'))
        grupo_de = {i: g['name'] for g in gj['groups'] for i in g['ids']}

    out, cambios = [], []
    for uni, slug in seg['unis']:
        f = os.path.join(ROOT, seg['dir'], '00_Data', 'processed', f'programas_{slug}.json')
        excluidos = 0
        for i, r in enumerate(json.load(open(f, encoding='utf-8'))):
            nv = (r.get('tipo') or '').strip()
            if nv.lower() in seg['excluir_nv']:
                excluidos += 1; continue  # p.ej. las 10 áreas temáticas de ESAN: no son programas
            url = r.get('url')
            nombre = RENOMBRES.get(url) or (r.get('nombre') or '').strip()
            if nombre.lower() in GENERICOS:
                nombre = del_slug(url)
            if url in RENOMBRES: cambios.append((uni, 'renombrado', nombre, url))
            t = seg['tipo_de'].get(nv.lower())
            assert t, f'tipo nativo sin mapear en {uni}: {nv!r}'
            ia = bool(r.get('es_candidato_ia'))
            if ia and url in SIN_IA:
                ia = False; cambios.append((uni, 'sin marca IA', nombre, SIN_IA[url]))
            h = horas(r.get('duracion')); p = precio_lista(r.get('precio_texto'))
            rid = f'{slug}#{i}'
            out.append(dict(
                # agg = la fila es una categoría que agrupa varios programas, no un programa (p.ej. las 5
                # maestrías de UPC sin página propia); viene del propio dato, no de una lista por institución.
                id=rid, u=uni, n=nombre, l=clasificar(nombre, r.get('categoria')),
                t=t, nv=nv, agg=bool(r.get('es_categoria')),
                ia=ia, p=p, h=h, ph=round(p / h) if p and h else None,
                g=grupo_de.get(rid) if ia else None,
                m=r.get('modalidad'), d=r.get('duracion'), url=url,
            ))
        if excluidos: cambios.append((uni, 'excluidas', f'{excluidos} filas fuera del dataset', 'ver excluir_nv'))

    data = dict(
        seg=seg['key'], titulo=seg['titulo'], fecha=seg['fecha'],
        benchmark=seg['benchmark'], benchmark_largo=seg['benchmark_largo'],
        unis=[u for u, _ in seg['unis']], no_comparable=list(seg['no_comparable']),
        lineas=list(NOMBRES), tipos=seg['tipos'], corto=seg['corto'], largo=seg['largo'],
        notas=NOTAS[seg['key']], rows=out,
    )
    dest = os.path.join(ROOT, 'app', 'src', f'data_{seg["key"]}.json')
    json.dump(data, open(dest, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    return dest, out, cambios


def meta():
    """Metadatos de los dos segmentos en un archivo chico: App.jsx los importa de forma estática
    (barra lateral y opciones del filtro) mientras las filas viajan en el chunk perezoso."""
    m = {s['key']: dict(titulo=s['titulo'], benchmark=s['benchmark'], benchmark_largo=s['benchmark_largo'],
                        fecha=s['fecha'], tipos=s['tipos']) for s in (INSTITUTOS, POSGRADO)}
    dest = os.path.join(ROOT, 'app', 'src', 'segmentos_meta.json')
    json.dump(m, open(dest, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return dest


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    revisar = '--grupos' in sys.argv  # imprime cada grupo con sus cursos para revisarlo a mano
    pedidos = args or ['institutos', 'posgrado']
    for seg in (INSTITUTOS, POSGRADO):
        if seg['key'] not in pedidos: continue
        dest, out, cambios = build(seg)
        if revisar:
            por_grupo = collections.defaultdict(list)
            for r in out:
                if r['ia']: por_grupo[r['g']].append(r)
            print(f"\n===== {seg['titulo']}")
            for g, rs in sorted(por_grupo.items(), key=lambda x: -len(x[1])):
                comps = sorted({r['u'] for r in rs if not r['u'].startswith('USIL')})
                print(f"\n{g}  ({len(rs)} cursos · {len(comps)} competidores · USIL {'si' if any(r['u'].startswith('USIL') for r in rs) else 'NO'})")
                for r in rs: print(f"   {r['u']:<12} {r['t']:<20} {r['n']}")
            continue
        ia = [r for r in out if r['ia']]
        print(f'\n-> {dest}  {len(out)} filas · {len(ia)} con IA ({100 * len(ia) / len(out):.1f}%)')
        print('   tipos:', dict(collections.Counter(r['t'] for r in out)))
        print('   por institución:', {u: f"{sum(1 for r in out if r['u'] == u and r['ia'])}/{sum(1 for r in out if r['u'] == u)}" for u in dict.fromkeys(r['u'] for r in out)})
        for c in cambios: print('   corrección:', ' · '.join(c))
        sin_grupo = [(r['id'], r['u'], r['n']) for r in ia if not r['g']]
        print(f'   cursos IA sin grupo: {len(sin_grupo)}')
        for s in sin_grupo: print('     ', ' · '.join(s))
    print('\n->', meta())
