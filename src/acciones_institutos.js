/* Acciones del segmento Institutos, verificadas contra data_institutos.json (43 cursos con IA de 513 programas,
   6 institutos, 12 tipos de curso IA curados en scripts/grupos_ia_institutos.json). Reverificación 2026-09-16:
   el catálogo del IE subió de 11 a 17 programas y de 3 a 6 con IA (ver notas de confianza en build_segment.py).
   Reverificación 2026-09-16 ronda 2: TECSUP se recapturó desde su REST API (1 a 5 con IA) y los grupos IA se
   re-curaron (13 a 12 tipos); solo cambian composición de grupos y totales, el catálogo del IE no se tocó.
   Reverificación 2026-09-16 ronda 3: de los 5 candidatos de TECSUP, 3 no superaron la regla del proyecto
   (IA mención de paso en un temario de otro tema, no en h1/URL) y se quitaron: Planner de Mantenimiento,
   PMBOK y Power BI. Quedan 2 (Desarrollo Web Java con Vibe Coding, Diseña tu StartUp con IA); ver
   Institutos/01_Logs/crawl_log.json → reverificacion_2026-09-16_ronda3. El catálogo del IE no se tocó.
   Etiquetas: oportunidad Alta/Media/Baja, riesgo Alto/Medio/Bajo, dificultad Alta/Media/Baja.
   Sin "Competitividad de pricing": en este segmento solo ISIL, SENATI y TECSUP publican precio. */
export const ACCIONES = [
  {
    title: 'Abrir IA para negocios y emprendedores en el IE',
    detail: 'Único tipo de curso IA que venden los 5 competidores (8 cursos). El IE tiene 0 y el nombre del instituto lo pide.',
    oportunidad: 'Alta',
    riesgo: 'Bajo',
    dificultad: 'Baja',
    oportunidad_why: 'Es el único tipo de curso IA presente en los 5 competidores, con 8 cursos (SENATI 3, ISIL 2, Cibertec, Toulouse y TECSUP 1 cada uno), y cae en Gestión y Negocios, la línea con más IA del segmento: 11 de los 43 cursos IA, en 6 institutos. El Instituto de Emprendedores suma ahí su primer programa (Inteligencia Artificial Generativa para la Productividad, confianza media: solo brochure, sin página propia activa), pero ninguno de sus 17 programas —Datos (4), Marketing (3), Tecnología (3), IA transversal (2), Comunicación (2), Hotelería (2) y Gestión y Negocios (1)— cae en el tipo específico de negocios y emprendimiento que sí venden los 5 competidores.',
    riesgo_why: 'La demanda está validada por los 5 competidores, y 3 de los 8 cursos son programas largos de SENATI, señal de que el tema aguanta formatos de más horas. El riesgo es de diferenciación: se entra último a un tipo ya poblado. Como ninguno de esos 8 cursos publica precio (solo ISIL y SENATI publican tarifas en todo el segmento), tampoco hay referencia pública para posicionar la del IE.',
    dificultad_why: 'Es un curso corto, el formato que el IE ya opera en 14 de sus 17 programas, y se apoya en la plana de la Certificación en Inteligencia Artificial que ya dicta. No pide acreditación ni infraestructura nueva.',
    variables: ['Posicionamiento en IA', 'Cobertura de portafolio'],
  },
  {
    title: 'Confirmar y ampliar IA en marketing y redes',
    detail: 'El IE ya anuncia un curso de IA para redes sociales, pero solo como brochure sin página propia. Marketing Digital y Community Manager siguen sin IA.',
    oportunidad: 'Media',
    riesgo: 'Bajo',
    dificultad: 'Baja',
    oportunidad_why: 'El tipo "IA aplicada al marketing y redes sociales" suma ahora 5 cursos: Toulouse 3, Cibertec 1 y el propio IE 1 (Inteligencia Artificial Aplicada a las Redes Sociales), publicado como brochure en el dominio de USIL pero con la página propia del curso caída (404) desde septiembre. Los 3 programas de esa familia que el IE ya dictaba —Marketing Digital, Community Manager y Ventas Digitales por WhatsApp— siguen sin mencionar IA: la prioridad es reactivar la página del curso nuevo y llevar esa misma IA a los 3 vigentes.',
    riesgo_why: 'Se toca el temario de cursos que ya se dictan y ya tienen público; si la IA no engancha, el curso sigue vendiéndose como antes. El riesgo real es de credibilidad: publicitar un curso de IA cuya única evidencia hoy es un PDF, sin confirmar con el instituto que sigue vigente, puede quedar en promesa incumplida frente a los 4 cursos de la competencia que sí están en línea.',
    dificultad_why: 'Confirmar vigencia con el instituto, republicar la página del curso nuevo y actualizar el temario de los 3 cursos vigentes con los mismos docentes. Es la acción más barata de la lista y la que puede salir en un ciclo.',
    variables: ['Cobertura de portafolio', 'Posicionamiento en IA'],
  },
  {
    title: 'Montar un track técnico corto de datos, ML y prompting',
    detail: 'Ciencia de datos y ML: 5 cursos de 3 competidores, el IE 0. Ya tiene 4 programas de datos sin IA sobre los que apoyarse.',
    oportunidad: 'Media',
    riesgo: 'Medio',
    dificultad: 'Alta',
    oportunidad_why: 'Es el segundo tipo de curso IA más ofrecido del segmento (5 cursos: Cibertec 2, ISIL 2, Toulouse 1) y el IE ya tiene la audiencia: 4 de sus 17 programas son de Datos y Analítica (Power BI, Business Intelligence con IA, Excel y la Certificación en Analítica de Datos). Sumarle el desarrollo con Python y el prompting completa una ruta que hoy termina en el tablero.',
    riesgo_why: 'Cibertec y TECSUP son los únicos institutos con IA técnica de desarrollo (Cibertec con 2 cursos de Python y 1 de prompting, TECSUP con 1 de vibe coding) y Cibertec concentra 6 de sus 18 cursos IA en Tecnología y Software. Disputarle ese terreno con un catálogo de 17 programas expone al IE a la comparación directa con el líder. Un curso de fundamentos antes del track completo limita la pérdida a un piloto.',
    dificultad_why: 'Pide docentes de Python y machine learning, entorno de laboratorio y una secuencia de 3 o 4 cursos encadenados. Es el perfil técnico que hoy no aparece en ninguno de los 17 programas del IE, y la única acción de la lista que no reutiliza plana existente.',
    variables: ['Posicionamiento en IA', 'Cobertura de portafolio', 'Diferenciación de nicho'],
  },
  {
    title: 'Entrar a IA para kids & teens, el nicho que solo disputa Cibertec',
    detail: '3 cursos de IA para niños y adolescentes en todo el segmento, los 3 de Cibertec. Los otros 4 institutos no tienen ninguno.',
    oportunidad: 'Media',
    riesgo: 'Medio',
    dificultad: 'Media',
    oportunidad_why: 'Es el tipo con más cursos y menos competencia del segmento: 3 cursos (IA para diseñadores, para emprendedores y para mentes creativas del futuro) y un solo instituto detrás. Los otros cuatro competidores no tienen nada para menores. USIL además ya tiene colegio y pregrado, así que el canal hacia familias existe fuera del IE.',
    riesgo_why: 'El público es distinto del que compra hoy: los 17 programas del IE son para profesionales adultos. Vender a menores exige tutores con experiencia en aula infantil, consentimiento de padres y control de contenidos por edad. Y la demanda está probada por un único competidor, así que el tamaño real del mercado no se conoce.',
    dificultad_why: 'No reutiliza el temario adulto: hay que diseñar por tramos de edad, contratar o formar tutores y abrir un canal comercial hacia familias y colegios, con calendario escolar en vez de calendario ejecutivo.',
    variables: ['Diferenciación de nicho', 'Cobertura de portafolio'],
  },
]

export const VARIABLES = [
  {
    name: 'Posicionamiento en IA',
    definition: 'Cuánto pesa y cuánto se ve el Instituto de Emprendedores en la oferta de formación con IA frente a Cibertec, Toulouse, ISIL, SENATI y TECSUP, por volumen y por amplitud temática.',
    kpi: 'Cuota del IE en los cursos IA del segmento: 6 de 43 (14.0%). Tipos de curso IA cubiertos: 5 de 12 (Cibertec 18, Toulouse 8, ISIL 6, SENATI 3, TECSUP 2 en el resto del segmento).',
  },
  {
    name: 'Cobertura de portafolio',
    definition: 'Presencia del IE en los tipos de curso IA donde la competencia ya probó que hay demanda, es decir, los que ofrecen al menos 2 institutos rivales.',
    kpi: 'Tipos IA con 2 o más competidores en los que el IE tiene al menos un curso: 2 de 7 (IA generativa para contenidos, IA aplicada al marketing y redes sociales). Faltan 5, que suman 20 cursos: IA para negocios y emprendedores (8), ciencia de datos y machine learning (5), desarrollo de software y vibe coding con IA (3), IA para la docencia (2) e IA en compras, procesos y gestión de proyectos (2).',
  },
  {
    name: 'Diferenciación de nicho',
    definition: 'Presencia de IA donde el IE ya tiene base de catálogo y hay pocos rivales con IA, de modo que la IA refuerce una fortaleza en vez de competir en temas saturados.',
    kpi: 'Cursos IA del IE en tipos con 0 o 1 competidor: 4 de 6 (fundamentos y prompting de IA, IA en ofimática y presentaciones, analítica y dashboards con IA). Los nichos de varios cursos libres sin el IE son IA para kids & teens (3 cursos, solo Cibertec) e IA en RRHH y gestión legal (2 cursos, solo Cibertec). Prevalencia del IE: 35.3%, la más alta del segmento, pero sobre 17 programas frente a una mediana de 85.',
  },
]
