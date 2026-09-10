// 5 acciones propuestas y verificadas contra data.json (flujo multiagente: 2 propuestas, juez y verificador adversarial, 2026-09-10).
// Etiquetas: oportunidad Alta/Media/Baja, riesgo Alto/Medio/Bajo, dificultad Alta/Media/Baja. El porqué de cada una va en el tooltip.
export const ACCIONES = [
  {
    "title": "Convertir cortos IA en tres especializaciones apilables",
    "detail": "Apilar 10 cortos existentes: el formato explica 68% de la brecha de ticket IA con UPC (S/ 774 vs S/ 2,043).",
    "oportunidad": "Alta",
    "riesgo": "Bajo",
    "dificultad": "Media",
    "oportunidad_why": "Ataca la causa principal del ticket bajo: el formato explica el 68% de la brecha con UPC y el 55% de la brecha con el conjunto de pares. Cada alumno que compra la ruta paga de 3.5 a 4.5 veces lo que paga por un curso suelto.",
    "riesgo_why": "Reutiliza 10 cursos y docentes que ya están en el mercado, y los cortos se siguen vendiendo sueltos, así que no se pierde volumen. Si la ruta no vende, solo se pierde el diseño de 1 módulo y 1 integrador por ruta. El punto débil es comercial: USIL tiene solo 15 largos (7% de su catálogo). En docencia los cortos IA de rivales tienen mediana S/ 250, pero UPC vende los suyos en vivo a S/ 1,800–1,900 y su largo a S/ 4,200, así que el público docente sí paga por formatos en vivo.",
    "dificultad_why": "Los módulos y los docentes existen. Falta el diseño curricular de 1 módulo y 1 integrador por ruta, la aprobación como especialización con su certificación, la convalidación de cortos ya cursados y la coordinación entre Educación, Ingeniería y Marketing.",
    "variables": [
      "Posicionamiento en IA",
      "Competitividad de pricing"
    ]
  },
  {
    "title": "Lanzar familia de cursos de IA generativa para productividad",
    "detail": "12 cursos rivales (PUCP 7, UPC 4, ULima 1) con mediana S/ 1,399 y USIL en 0; entrar a S/ 600–700.",
    "oportunidad": "Media",
    "riesgo": "Bajo",
    "dificultad": "Baja",
    "oportunidad_why": "Es la mayor señal de demanda del mercado (12 cursos, 3 rivales) y sirve a profesionales no técnicos de cualquier línea. Pero el ticket es de curso corto (unos S/ 650 frente a una mediana de S/ 4,650 de un largo IA) y el tema está saturado (PUCP sola tiene 7). Su valor extra es de embudo: capta alumnos para las rutas y el programa de directivos.",
    "riesgo_why": "Tres rivales ya validaron la demanda. A S/ 600–700, USIL queda por debajo de 9 de los 11 cortos rivales y por encima del piso asíncrono de S/ 250 . La inversión es la de un curso corto y el contenido no tiene riesgo regulatorio. El solapamiento interno es menor: 'Competencias Digitales y Analítica de Datos' (S/ 400), y 'Tecnología Fácil' se reconvierte a propósito.",
    "dificultad_why": "Contenido no técnico que pueden dictar docentes que ya enseñan IA generativa. Aun así es un formato que ya opera, no necesita aprobación de programa largo y puede salir en un ciclo.",
    "variables": [
      "Cobertura de portafolio",
      "Posicionamiento en IA",
      "Competitividad de pricing"
    ]
  },
  {
    "title": "Publicar precio público y recalibrar cortos IA bajo mercado",
    "detail": "8 de 30 cursos IA solo muestran precio comunidad; 13 cortos de cuatro líneas: mediana S/ 450 vs S/ 1,450 rival.",
    "oportunidad": "Media",
    "riesgo": "Medio",
    "dificultad": "Baja",
    "oportunidad_why": "Sube cerca de un 20% la lista de 10 fichas de inmediato y sin desarrollar contenido, y corrige además la lectura del benchmark: parte de la distancia con PUCP y UPC es un efecto de publicar solo el precio de comunidad. No toca la causa principal del ticket bajo, que es el formato (68% de la brecha con UPC).",
    "riesgo_why": "No hay datos de matrícula para medir la elasticidad, y el QS de USIL (120) está por debajo de UPC (107), ULima (94) y PUCP (15), así que tiene que defender su propuesta de valor. Lo mitigan que la comunidad USIL mantiene su precio y que se puede pilotear en la mitad de los cursos durante una cohorte. Hay que vigilar el Excel con IA (id 116): subiría a ~S/ 810 y convive con 9 cursos de Excel y Power BI sin IA de S/ 224 a S/ 790 .",
    "dificultad_why": "Es una decisión de tarifas y un cambio de fichas web. No requiere rediseñar cursos, contratar docentes ni acreditar nada.",
    "variables": [
      "Competitividad de pricing"
    ]
  },
  {
    "title": "Lanzar programa ejecutivo de IA para directivos",
    "detail": "Grupo con más dinero publicado: 9 cursos de 4 rivales, S/ 32,400; USIL tiene 0. Entrar por curso ejecutivo.",
    "oportunidad": "Alta",
    "riesgo": "Alto",
    "dificultad": "Alta",
    "oportunidad_why": "Es el grupo con más dinero publicado (S/ 32,400). El ticket es de 3 a 9 veces el corto IA típico de USIL (de S/ 485 a S/ 1,500–4,500), y además cubre el mayor hueco de la línea con más IA del mercado.",
    "riesgo_why": "En el público directivo pesa la marca: PUCP (QS 15), ULima (94) y UPC (107) están mejor rankeadas, y UTEC tiene 7 de los 10 cursos IA de S/ 7,500 o más . Si el programa largo no llena, el costo de docentes ejecutivos se pierde. La etapa 1 sirve para probar la demanda antes de invertir en el largo.",
    "dificultad_why": "Pide docentes con experiencia en alta dirección y un formato ejecutivo (casos, networking, horarios para gerentes). USIL tiene solo 15 programas largos en todo su catálogo (7%, 2 con IA) y ningún curso previo en este grupo que sirva de base.",
    "variables": [
      "Cobertura de portafolio",
      "Posicionamiento en IA"
    ]
  },
  {
    "title": "Pilotear dos cursos de IA en salud",
    "detail": "USIL es 1.ª en catálogo de Salud (20 de 55 programas) y tiene 0 de los 5 cursos IA de la línea.",
    "oportunidad": "Media",
    "riesgo": "Medio",
    "dificultad": "Media",
    "oportunidad_why": "Cierra el hueco más visible del benchmark (1.ª en catálogo de Salud y 0 en IA) y diferencia a USIL, porque ningún rival vende IA en salud abierta al público con precio, salvo el curso asíncrono de UPC. Pero el mercado IA de salud es pequeño y barato (5 cursos; los 3 con precio, de S/ 150 a S/ 250), así que el ingreso esperado es limitado: el valor está sobre todo en el posicionamiento.",
    "riesgo_why": "Los datos de salud son datos personales sensibles, que exigen protocolos de privacidad y ética, y hay que cuidar la credibilidad clínica de lo que se promete. La demanda no está probada y la única referencia pública es UPC a S/ 250 por 129 h (unos S/ 1.9 por hora). Un piloto de una cohorte por curso limita la pérdida.",
    "dificultad_why": "USIL no tiene docentes que combinen clínica e IA: hay que armar co-docencia con el equipo del id 95 y con Datos, validar contenidos con la Facultad de Ciencias de la Salud y diseñar casos con datos anonimizados. Pero son cursos cortos montados sobre un catálogo y un público que USIL ya tiene.",
    "variables": [
      "Diferenciación de nicho",
      "Cobertura de portafolio",
      "Posicionamiento en IA"
    ]
  }
]

export const VARIABLES = [
  {
    "name": "Posicionamiento en IA",
    "definition": "Cuánto pesa y cuánto se ve USIL en la oferta de formación con IA frente a UPC, PUCP, ULima, UTEC y Continental, por volumen y por amplitud temática.",
    "kpi": "Cuota de USIL en los cursos IA del mercado: hoy 30 de 137 (21.9%). Grupos temáticos IA cubiertos: hoy 17 de 27 (UPC 20, PUCP 15, UTEC 11, Continental 10, ULima 8)."
  },
  {
    "name": "Competitividad de pricing",
    "definition": "Dónde queda el precio de lista de los cursos IA de USIL frente a sus propios cursos sin IA de la misma línea y tipo, y frente a los rivales en la misma línea y formato. Mide cuánta prima puede cobrar la IA sin perder atractivo.",
    "kpi": "Prima IA interna en cursos cortos, con el método de la app (celdas línea × tipo con 5 o más cursos sin IA, ponderadas por cursos IA): +32% (comunicar entre +25% y +35%). En 9 de las 13 líneas donde USIL y sus competidores venden IA con precio, el curso IA de USIL cuesta entre 46% y 89% menos (mediana por línea y tipo). Se lee con cuidado: 8 de los 30 cursos IA de USIL publican solo el precio para la comunidad USIL. Meta: prima de 25% a 35% manteniendo el precio por debajo de la mediana de los cortos IA en vivo de UPC (S/ 1,900, 12 cursos)."
  },
  {
    "name": "Cobertura de portafolio",
    "definition": "Presencia de USIL en los grupos temáticos de IA donde la competencia ya probó que hay demanda, es decir, los que ofrecen al menos 2 rivales.",
    "kpi": "Grupos IA con 2 o más rivales en los que USIL tiene al menos un curso: hoy 13 de 22. Faltan 9 grupos que suman 46 cursos IA, entre ellos IA generativa para productividad (12), directivos (9) y salud (5)."
  },
  {
    "name": "Diferenciación de nicho",
    "definition": "Presencia de IA en los espacios donde USIL ya tiene una base de catálogo propia y hay pocos rivales con IA, de modo que la IA refuerce una fortaleza existente en vez de competir en temas saturados.",
    "kpi": "Cursos IA de USIL en grupos con 0 o 1 universidad rival: hoy 7 de 30 (23.3%; UPC 31.4%, UTEC 28.6%, Continental 27.8%, PUCP 6.9%). Con 0 a 2 rivales el filtro casi no discrimina (USIL 60%, UPC 63%, PUCP 69%). Cuota IA en las líneas donde USIL es 1.ª en catálogo: Salud 0 de 5 (catálogo 36.4%); Comunicación y Diseño 2 de 12 (catálogo 36.1%)."
  }
]
