/* Acciones del segmento Posgrado, verificadas contra data_posgrado.json (57 registros con IA de 710,
   6 escuelas, 12 tipos de curso IA curados en scripts/grupos_ia_posgrado.json). Reverificación 2026-09-16
   ronda 2: ESAN pierde sus 10 áreas temáticas (fuera del dataset, no son programas) y UPC se desglosa de
   45 categorías a 311 programas individuales; ambas cosas cambian los conteos por competidor de este archivo.
   UPC ya es comparable (solo 5 de sus 311 filas siguen siendo categoría). Reverificación ronda 3: 2 de esas
   5 categorías de UPC (Dirección de la Comunicación Empresarial, Gestión y Desarrollo del Talento) traían
   su marca IA del cuerpo de la página de categoría y duplicaban programas ya desglosados; se les quitó la
   marca (ver Posgrado/01_Logs/crawl_log.json → reverificacion_2026-09-16_ronda3). UPC pasa de 32/311 a
   30/311 (9.6%) y dos grupos de cursos IA pierden 1 registro cada uno (talento y RRHH, contenidos). USIL EPG
   sin cambios en su propio catálogo (10 de 74, 13.5%, sigue 1.ª entre comparables).
   Etiquetas: oportunidad Alta/Media/Baja, riesgo Alto/Medio/Bajo, dificultad Alta/Media/Baja.
   Sin "Competitividad de pricing": ninguna escuela de posgrado del benchmark publica precio. */
export const ACCIONES = [
  {
    title: 'Llevar IA a Gestión Pública y Finanzas, donde la EPG ya tiene catálogo',
    detail: '10 programas de la EPG entre las dos líneas y ninguno con IA. U. Pacífico vende 4, UPC 3 y CENTRUM 1.',
    oportunidad: 'Alta',
    riesgo: 'Bajo',
    dificultad: 'Media',
    oportunidad_why: 'Son los dos huecos con demanda ya probada y catálogo propio donde apoyarse. "IA para el sector público" suma 4 registros de 1 competidor (U. Pacífico) y "IA en finanzas e inversiones" 4 de 2 (UPC 3 y CENTRUM 1). La EPG tiene 4 programas de Gestión Pública y 6 de Finanzas y Contabilidad, los 10 sin una sola mención de IA.',
    riesgo_why: 'El formato es educación ejecutiva, donde la EPG concentra 53 de sus 74 programas y 9 de sus 10 con IA: se juega en casa. U. Pacífico ya validó el público estatal con 4 programas, tres de ellos de especialización. El riesgo es de timing: es el competidor con más recorrido en el tema y con la Escuela de Gestión Pública como marca.',
    dificultad_why: 'La IA es la mitad del contenido; la otra mitad es regulatoria y distinta en cada línea (contrataciones del Estado e Invierte.pe de un lado, riesgo y cobranzas del otro). Pide docentes de sector y coordinación con dos áreas de la EPG a la vez.',
    variables: ['Cobertura de portafolio', 'Posicionamiento en IA'],
  },
  {
    title: 'Pilotear IA en Salud, la segunda línea de la EPG',
    detail: '10 programas de Salud en la EPG y 0 con IA. Ningún competidor del segmento vende un programa de Salud con IA.',
    oportunidad: 'Media',
    riesgo: 'Medio',
    dificultad: 'Media',
    oportunidad_why: 'Salud es la segunda línea de la EPG por catálogo (10 de sus 74 programas, detrás de Gestión y Negocios con 15) y no tiene ningún programa con IA. Tras la reverificación, todo el segmento de posgrado queda en cero registros de IA en Salud: es un hueco de mercado completo, no solo de la EPG. Repite el patrón de educación continua, donde USIL es 1.ª en catálogo de Salud y 0 en IA, y quien entre primero con un programa propio se queda con la lectura del tema.',
    riesgo_why: 'Sin un solo competidor que valide la demanda con un programa propio, el riesgo es lanzar un programa que el mercado todavía no pide. Los datos clínicos son además datos personales sensibles y exigen protocolos de privacidad, validación con la facultad y cuidado con lo que se promete clínicamente.',
    dificultad_why: 'Ningún programa del catálogo actual combina clínica con IA. Hay que armar co-docencia con el área de Innovación e IA, que ya tiene 4 programas con IA, y validar contenidos con la Facultad de Ciencias de la Salud. El formato de educación ejecutiva permite empezar con una cohorte.',
    variables: ['Diferenciación de nicho', 'Cobertura de portafolio'],
  },
  {
    title: 'Abrir una mención o maestría en Datos e IA',
    detail: 'De las 16 maestrías y MBA de la EPG, la única con IA es una certificación dentro del Executive MBA. UPC ya vende como programas propios una Maestría en Inteligencia Artificial y una Maestría en Data Science, y ESAN y UTP también la venden con IA en el título.',
    oportunidad: 'Alta',
    riesgo: 'Alto',
    dificultad: 'Alta',
    oportunidad_why: '"Ciencia de datos y machine learning" es el tipo de curso IA con más competidores del segmento: 5 de 5, con las cinco escuelas rivales presentes (UPC, CENTRUM, ESAN, U. Pacífico y UTP). Contiene 3 maestrías con IA en el título -Maestría en Data Science (UPC), Maestría en Data Analytics & Artificial Intelligence (ESAN) y Maestría en Ciencia de Datos e Inteligencia Artificial (UTP)-, y aparte UPC vende una cuarta, la Maestría en Inteligencia Artificial, junto con un Diplomado en Inteligencia Artificial para los Negocios (grupo propio). La EPG tiene 16 maestrías y MBA y un solo registro con IA, que además es una certificación dentro del Executive MBA con ESIC, no una maestría propia. Es el hueco de mayor ticket del segmento.',
    riesgo_why: 'Es la apuesta más cara y ahora contra tres competidores consolidados, no dos: ESAN vende la Maestría en Data Analytics & Artificial Intelligence, UTP la Maestría en Ciencia de Datos e IA, y UPC ya tiene dos maestrías propias de IA/datos (Inteligencia Artificial y Data Science) más un diplomado en IA para los negocios. Si el programa no llena, lo hundido es plana docente y licenciamiento, no un curso corto. La EPG además tiene solo 2 programas en la línea de Datos y Analítica, así que no hay embudo propio que alimente la maestría.',
    dificultad_why: 'Una maestría nueva pide licenciamiento del programa, plana con grado y entre 18 y 24 meses de diseño. El camino corto es una mención dentro de una maestría vigente, apoyada en los 4 programas con IA del área de Innovación e IA.',
    variables: ['Posicionamiento en IA', 'Cobertura de portafolio'],
  },
  {
    title: 'Convertir "Innovación e IA" en la marca de IA de la EPG',
    detail: '4 de los 5 programas de esa área tienen IA y la EPG lidera en prevalencia entre comparables (13.5%). El activo existe, falta contarlo junto.',
    oportunidad: 'Media',
    riesgo: 'Bajo',
    dificultad: 'Baja',
    oportunidad_why: 'La EPG tiene la prevalencia de IA más alta del segmento: 10 de 74 (13.5%), frente a U. Pacífico 11.5%, UPC 9.6%, CENTRUM 5.4%, UTP 3.4% y ESAN 1.1%. Y ya concentra 4 programas con IA en una sola área, la más densa del segmento. Lo que falta no es producto: es dejar de venderlo como 10 programas sueltos en 5 líneas distintas.',
    riesgo_why: 'No se crea producto, se ordena y se comunica el que ya está en venta, así que la inversión es de portafolio y marketing. El riesgo es de expectativa: 9 de los 10 programas con IA son de educación ejecutiva y ninguna maestría lleva IA, de modo que la promesa tiene que ser de especialización ejecutiva y no de posgrado en IA.',
    dificultad_why: 'Una landing de área, una ruta entre los programas que ya existen y una certificación transversal que los encadene. No pide programa nuevo, ni acreditación, ni plana adicional.',
    variables: ['Posicionamiento en IA', 'Diferenciación de nicho'],
  },
  {
    title: 'Sumar IA en gestión del talento y RRHH',
    detail: 'Los 3 competidores grandes ya lo venden (CENTRUM, UPC y U. Pacífico); la EPG tiene 4 programas en la línea y ninguno con IA.',
    oportunidad: 'Media',
    riesgo: 'Bajo',
    dificultad: 'Baja',
    oportunidad_why: 'Es el tipo con más registros del segmento fuera de dirección y marketing: 5 entre los tres competidores grandes (CENTRUM con compensaciones y beneficios, UPC con 3 certificaciones de people analytics y gestión de RRHH con IA, U. Pacífico con RRHH para el sector público). Cuando los tres entran por caminos distintos, la señal de demanda no depende de un solo actor. La EPG tiene 4 programas en la línea de Talento y RRHH y ninguno con IA.',
    riesgo_why: 'Es un curso de educación ejecutiva sobre una línea que la EPG ya dicta, con demanda validada por 3 competidores y contenido sin riesgo regulatorio. El valor es sobre todo de cobertura: cierra un tipo de curso IA donde hoy la EPG no compite.',
    dificultad_why: 'Contenido no técnico (people analytics, sesgo algorítmico en selección, compensación basada en datos) que puede dictar la plana de gestión de personas con apoyo del área de Innovación e IA. Sale en un ciclo.',
    variables: ['Cobertura de portafolio', 'Posicionamiento en IA'],
  },
]

export const VARIABLES = [
  {
    name: 'Posicionamiento en IA',
    definition: 'Cuánto pesa y cuánto se ve la EPG en la oferta de posgrado con IA frente a UPC, CENTRUM, ESAN, U. Pacífico y UTP, por volumen y por amplitud temática.',
    kpi: 'Cuota de la EPG en los registros con IA del segmento: 10 de 57 (17.5%). Tipos de curso IA cubiertos: 6 de 12 (UPC 30, CENTRUM 8, U. Pacífico 7, ESAN 1, UTP 1 en el resto del mercado). Prevalencia 13.5%, la más alta del segmento.',
  },
  {
    name: 'Cobertura de portafolio',
    definition: 'Presencia de la EPG en los tipos de curso IA donde la competencia ya probó que hay demanda, es decir, los que ofrecen al menos 2 escuelas rivales.',
    kpi: 'Tipos IA con 2 o más competidores en los que la EPG tiene al menos un programa: 2 de 6. Faltan 4, que suman 21 registros: ciencia de datos y machine learning (7), IA en operaciones y cadena de suministro (5), IA en gestión del talento y RRHH (5) e IA en finanzas e inversiones (4).',
  },
  {
    name: 'Diferenciación de nicho',
    definition: 'Presencia de IA donde la EPG ya tiene base de catálogo y hay pocas escuelas rivales con IA, de modo que la IA refuerce una fortaleza en vez de competir en temas saturados.',
    kpi: 'Programas con IA de la EPG en tipos con 0 o 1 competidor: 6 de 10 (sistemas y ciberseguridad, docencia y aprendizaje, derecho y regulación, creación de contenidos). Es la única escuela con IA en sistemas y ciberseguridad (0 competidores); en docencia y en creación de contenidos comparte el tipo con UPC. Su hueco más visible es Salud: 10 programas, 0 con IA, y ningún competidor del segmento tiene un programa de Salud con IA.',
  },
]
