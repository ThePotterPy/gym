import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando carga de datos iniciales para Emporio Gym...');

  const shouldReset = process.argv.includes('--reset');
  const [exerciseCount, scheduleCount, userCount] = await Promise.all([
    prisma.exercise.count(),
    prisma.weeklySchedule.count(),
    prisma.user.count(),
  ]);

  if (!shouldReset && exerciseCount > 0 && scheduleCount > 0 && userCount > 0) {
    console.log('✓ La base de datos ya está inicializada; no se modificaron datos.');
    return;
  }

  if (!shouldReset && (exerciseCount > 0 || scheduleCount > 0 || userCount > 0)) {
    throw new Error(
      'La base de datos está parcialmente inicializada. Ejecutá el seed manualmente con --reset después de hacer un respaldo.',
    );
  }

  // 1. Limpiar datos existentes únicamente cuando se solicita un reinicio explícito.
  if (shouldReset) {
    await prisma.workoutSet.deleteMany();
    await prisma.workoutSessionExercise.deleteMany();
    await prisma.workoutSession.deleteMany();
    await prisma.userAssignedRoutine.deleteMany();
    await prisma.routineExercise.deleteMany();
    await prisma.routine.deleteMany();
    await prisma.exerciseMuscle.deleteMany();
    await prisma.exercise.deleteMany();
    await prisma.weeklySchedule.deleteMany();
    await prisma.muscleGroup.deleteMany();
    await prisma.user.deleteMany();
  }

  // 2. Crear Grupos Musculares
  const muscleGroupsData = [
    { name: 'Pecho', slug: 'pecho', icon: 'Shield', description: 'Pectoral mayor, menor y clavicular', order: 1 },
    { name: 'Espalda', slug: 'espalda', icon: 'Maximize2', description: 'Dorsales, trapecios, romboides y lumbares', order: 2 },
    { name: 'Piernas / Cuádriceps', slug: 'piernas', icon: 'Zap', description: 'Cuádriceps, aductores y flexores', order: 3 },
    { name: 'Glúteos e Isquios', slug: 'gluteos-isquios', icon: 'Target', description: 'Glúteo mayor, medio e isquiotibiales', order: 4 },
    { name: 'Hombros', slug: 'hombros', icon: 'Crosshair', description: 'Deltoides anterior, lateral y posterior', order: 5 },
    { name: 'Bíceps', slug: 'biceps', icon: 'Flame', description: 'Bíceps braquial y braquiorradial', order: 6 },
    { name: 'Tríceps', slug: 'triceps', icon: 'Activity', description: 'Vasto lateral, medio y cabeza larga', order: 7 },
    { name: 'Abdomen / Core', slug: 'abdomen', icon: 'Compass', description: 'Recto abdominal, oblicuos y transverso', order: 8 },
    { name: 'Pantorrillas', slug: 'pantorrillas', icon: 'TrendingUp', description: 'Gemelos y sóleo', order: 9 },
  ];

  const muscleMap: Record<string, string> = {};
  for (const mg of muscleGroupsData) {
    const created = await prisma.muscleGroup.create({ data: mg });
    muscleMap[mg.slug] = created.id;
  }
  console.log('✓ Grupos musculares cargados');

  // 3. Crear Programación Semanal Recomendada por Sexo
  const weeklySchedulesData = [
    // HOMBRE (MALE)
    { dayOfWeek: 1, gender: 'MALE', title: 'Pecho + Tríceps', description: 'Enfoque en empuje, pectorales y tríceps', muscleGroupSlugs: 'pecho,triceps' },
    { dayOfWeek: 2, gender: 'MALE', title: 'Espalda + Bíceps', description: 'Enfoque en tracción, dorsales y flexores de codo', muscleGroupSlugs: 'espalda,biceps' },
    { dayOfWeek: 3, gender: 'MALE', title: 'Piernas + Pantorrillas', description: 'Cuádriceps pesados, gemelos y estabilidad', muscleGroupSlugs: 'piernas,pantorrillas' },
    { dayOfWeek: 4, gender: 'MALE', title: 'Hombros + Abdomen', description: 'Deltoides en 3 ángulos y trabajo de core', muscleGroupSlugs: 'hombros,abdomen' },
    { dayOfWeek: 5, gender: 'MALE', title: 'Pecho + Espalda', description: 'Super-series antagonistas de torso completo', muscleGroupSlugs: 'pecho,espalda' },
    { dayOfWeek: 6, gender: 'MALE', title: 'Brazos + Piernas (Isquios)', description: 'Bíceps, tríceps y cadena posterior', muscleGroupSlugs: 'biceps,triceps,gluteos-isquios' },
    { dayOfWeek: 0, gender: 'MALE', title: 'Descanso o Cardio Libre', description: 'Recuperación muscular activa', muscleGroupSlugs: 'abdomen' },

    // MUJER (FEMALE)
    { dayOfWeek: 1, gender: 'FEMALE', title: 'Glúteos + Isquios', description: 'Hip thrust, peso muerto rumano y aislamiento de glúteo', muscleGroupSlugs: 'gluteos-isquios' },
    { dayOfWeek: 2, gender: 'FEMALE', title: 'Espalda + Hombros', description: 'Postura, dorsales definidos y hombros estéticos', muscleGroupSlugs: 'espalda,hombros' },
    { dayOfWeek: 3, gender: 'FEMALE', title: 'Cuádriceps + Pantorrillas', description: 'Prensa, sentadilla búlgara y extensión de cuádriceps', muscleGroupSlugs: 'piernas,pantorrillas' },
    { dayOfWeek: 4, gender: 'FEMALE', title: 'Glúteos + Abdomen', description: 'Poleas para glúteo medio, abductores y core plano', muscleGroupSlugs: 'gluteos-isquios,abdomen' },
    { dayOfWeek: 5, gender: 'FEMALE', title: 'Tren Superior + Brazos', description: 'Pecho suave, bíceps, tríceps en polea y hombro lateral', muscleGroupSlugs: 'pecho,hombros,triceps,biceps' },
    { dayOfWeek: 6, gender: 'FEMALE', title: 'Pierna Completa & Enfoque Glúteo', description: 'Volumen global de tren inferior', muscleGroupSlugs: 'piernas,gluteos-isquios' },
    { dayOfWeek: 0, gender: 'FEMALE', title: 'Descanso o Movilidad', description: 'Estiramientos y recuperación', muscleGroupSlugs: 'abdomen' },
  ];

  for (const ws of weeklySchedulesData) {
    await prisma.weeklySchedule.create({ data: ws });
  }
  console.log('✓ Programación semanal por sexo cargada');

  // 4. Catálogo de Ejercicios
  const exercisesData = [
    // PECHO
    {
      name: 'Press de Banca Plano con Barra',
      slug: 'press-banca-plano-barra',
      description: 'El clásico constructor de masa y fuerza para el pectoral completo.',
      instructions: 'Acostado en banco plano, pies firmes en el suelo, retracción escapular, baja la barra al esternón controlando y empuja con potencia.',
      equipment: 'Barra y Discos',
      difficulty: 'Intermedio',
      defaultSets: 4,
      defaultReps: 10,
      defaultRest: 90,
      muscles: [{ slug: 'pecho', isPrimary: true }, { slug: 'triceps', isPrimary: false }, { slug: 'hombros', isPrimary: false }],
    },
    {
      name: 'Press Inclinado con Mancuernas',
      slug: 'press-inclinado-mancuernas',
      description: 'Excelente para enfatizar la porción clavicular (pecho superior).',
      instructions: 'Banco a 30-45 grados. Empuja hacia arriba convergiendo ligeramente sin chocar las mancuernas.',
      equipment: 'Mancuernas',
      difficulty: 'Intermedio',
      defaultSets: 4,
      defaultReps: 12,
      defaultRest: 60,
      muscles: [{ slug: 'pecho', isPrimary: true }, { slug: 'hombros', isPrimary: false }],
    },
    {
      name: 'Aperturas en Máquina Peck Deck',
      slug: 'peck-deck-aperturas',
      description: 'Aislamiento máximo del pectoral con tensión constante.',
      instructions: 'Ajusta la altura del asiento para que los codos queden alineados con la mitad del pecho. Junta al centro apretando 1 segundo.',
      equipment: 'Máquina',
      difficulty: 'Principiante',
      defaultSets: 3,
      defaultReps: 15,
      defaultRest: 60,
      muscles: [{ slug: 'pecho', isPrimary: true }],
    },
    {
      name: 'Cruce de Poleas Altas a Bajas',
      slug: 'cruce-poleas-altas',
      description: 'Focaliza la parte media e inferior del pecho con gran estiramiento.',
      instructions: 'Da un paso adelante con el torso ligeramente inclinado. Junta las manos frente al ombligo.',
      equipment: 'Polea',
      difficulty: 'Intermedio',
      defaultSets: 3,
      defaultReps: 12,
      defaultRest: 60,
      muscles: [{ slug: 'pecho', isPrimary: true }],
    },

    // ESPALDA
    {
      name: 'Jalón al Pecho en Polea (Agarre Prono)',
      slug: 'jalon-al-pecho-polea',
      description: 'Desarrolla la amplitud de los dorsales ("espalda en V").',
      instructions: 'Pecho inflado hacia la polea, tira con los codos apuntando al suelo hasta tocar la parte superior del pecho.',
      equipment: 'Polea',
      difficulty: 'Principiante',
      defaultSets: 4,
      defaultReps: 10,
      defaultRest: 75,
      muscles: [{ slug: 'espalda', isPrimary: true }, { slug: 'biceps', isPrimary: false }],
    },
    {
      name: 'Remo Gironda en Polea Baja (Sentado)',
      slug: 'remo-gironda-polea-baja',
      description: 'Constructor de grosor dorsal y densidad de espalda media.',
      instructions: 'Mantén la espalda recta sin arquearte hacia atrás. Tira hacia el abdomen bajo apretando las escápulas.',
      equipment: 'Polea',
      difficulty: 'Principiante',
      defaultSets: 4,
      defaultReps: 12,
      defaultRest: 60,
      muscles: [{ slug: 'espalda', isPrimary: true }, { slug: 'biceps', isPrimary: false }],
    },
    {
      name: 'Remo con Barra Inclinado (Pendlay o 45°)',
      slug: 'remo-barra-inclinado',
      description: 'Ejercicio compuesto fundamental para toda la espalda.',
      instructions: 'Caderas hacia atrás, torso a 45 grados, barra pegada a los muslos, tracciona hacia la cadera.',
      equipment: 'Barra y Discos',
      difficulty: 'Avanzado',
      defaultSets: 4,
      defaultReps: 8,
      defaultRest: 90,
      muscles: [{ slug: 'espalda', isPrimary: true }, { slug: 'biceps', isPrimary: false }],
    },
    {
      name: 'Remo Unilateral con Mancuerna en Banco',
      slug: 'remo-unilateral-mancuerna',
      description: 'Permite un rango de movimiento amplio y corregir asimetrías.',
      instructions: 'Apoya rodilla y mano en banco. Tracciona la mancuerna llevando el codo hacia el bolsillo del pantalón.',
      equipment: 'Mancuernas',
      difficulty: 'Intermedio',
      defaultSets: 3,
      defaultReps: 12,
      defaultRest: 60,
      muscles: [{ slug: 'espalda', isPrimary: true }],
    },

    // PIERNAS (CUÁDRICEPS)
    {
      name: 'Prensa Inclinada a 45 Grados',
      slug: 'prensa-inclinada-45',
      description: 'Permite mover cargas altas para cuádriceps de forma segura para la columna.',
      instructions: 'Pies a ancho de hombros en el centro de la plataforma. Baja profundo sin despegar el coxis del respaldo.',
      equipment: 'Máquina',
      difficulty: 'Intermedio',
      defaultSets: 4,
      defaultReps: 12,
      defaultRest: 90,
      muscles: [{ slug: 'piernas', isPrimary: true }, { slug: 'gluteos-isquios', isPrimary: false }],
    },
    {
      name: 'Sillón de Cuádriceps (Extensiones)',
      slug: 'extension-cuadriceps-sillon',
      description: 'Aislamiento directo y seguro para el cuádriceps completo.',
      instructions: 'Extiende las piernas con control, sostén 1 segundo arriba y desciende lento en 2-3 segundos.',
      equipment: 'Máquina',
      difficulty: 'Principiante',
      defaultSets: 4,
      defaultReps: 15,
      defaultRest: 60,
      muscles: [{ slug: 'piernas', isPrimary: true }],
    },
    {
      name: 'Sentadilla Búlgara con Mancuernas',
      slug: 'sentadilla-bulgara-mancuernas',
      description: 'El mejor ejercicio unilateral para cuádriceps y glúteos.',
      instructions: 'Un pie apoyado atrás en banco, desciende verticalmente con la pierna delantera hasta casi rozar el suelo.',
      equipment: 'Mancuernas',
      difficulty: 'Avanzado',
      defaultSets: 3,
      defaultReps: 10,
      defaultRest: 75,
      muscles: [{ slug: 'piernas', isPrimary: true }, { slug: 'gluteos-isquios', isPrimary: false }],
    },
    {
      name: 'Sentadilla Goblet con Mancuerna',
      slug: 'sentadilla-goblet-mancuerna',
      description: 'Excelente para aprender el patrón de sentadilla profunda con buena postura.',
      instructions: 'Sostén la mancuerna vertical pegada al pecho. Baja profundo empujando las rodillas hacia afuera.',
      equipment: 'Mancuernas',
      difficulty: 'Principiante',
      defaultSets: 3,
      defaultReps: 12,
      defaultRest: 60,
      muscles: [{ slug: 'piernas', isPrimary: true }],
    },

    // GLÚTEOS E ISQUIOS
    {
      name: 'Hip Thrust con Barra en Banco',
      slug: 'hip-thrust-barra',
      description: 'El rey de la activación y desarrollo del glúteo mayor.',
      instructions: 'Espalda alta apoyada en banco con almohadilla en la barra sobre la pelvis. Empuja desde los talones apretando arriba 2 seg.',
      equipment: 'Barra y Discos',
      difficulty: 'Intermedio',
      defaultSets: 4,
      defaultReps: 10,
      defaultRest: 90,
      muscles: [{ slug: 'gluteos-isquios', isPrimary: true }],
    },
    {
      name: 'Peso Muerto Rumano con Barra o Mancuernas',
      slug: 'peso-muerto-rumano',
      description: 'Gran estiramiento y trabajo de isquiotibiales y glúteo.',
      instructions: 'Piernas semi-flexionadas fijas, empuja la cadera hacia atrás como queriendo tocar una pared con los glúteos.',
      equipment: 'Barra y Discos',
      difficulty: 'Intermedio',
      defaultSets: 4,
      defaultReps: 10,
      defaultRest: 75,
      muscles: [{ slug: 'gluteos-isquios', isPrimary: true }, { slug: 'espalda', isPrimary: false }],
    },
    {
      name: 'Camilla Femoral Tumbado / Sentado',
      slug: 'camilla-femoral',
      description: 'Aislamiento puro para la flexión de rodilla de los isquios.',
      instructions: 'Alinea la rodilla con el eje de la máquina. Flexiona hacia los glúteos y baja lento.',
      equipment: 'Máquina',
      difficulty: 'Principiante',
      defaultSets: 4,
      defaultReps: 12,
      defaultRest: 60,
      muscles: [{ slug: 'gluteos-isquios', isPrimary: true }],
    },
    {
      name: 'Patada de Glúteo en Polea Baja',
      slug: 'patada-gluteo-polea',
      description: 'Aislamiento preciso de la parte alta y media del glúteo.',
      instructions: 'Tobillera puesta, patea hacia atrás y ligeramente en diagonal hacia afuera apretando el glúteo.',
      equipment: 'Polea',
      difficulty: 'Principiante',
      defaultSets: 3,
      defaultReps: 15,
      defaultRest: 45,
      muscles: [{ slug: 'gluteos-isquios', isPrimary: true }],
    },
    {
      name: 'Máquina de Abductores Sentada',
      slug: 'maquina-abductores-sentada',
      description: 'Ideal para redondear el glúteo medio y estabilidad pélvica.',
      instructions: 'Abre las piernas con fuerza explosiva, pausa de 1 segundo al abrir y cierre controlado.',
      equipment: 'Máquina',
      difficulty: 'Principiante',
      defaultSets: 4,
      defaultReps: 15,
      defaultRest: 45,
      muscles: [{ slug: 'gluteos-isquios', isPrimary: true }],
    },

    // HOMBROS
    {
      name: 'Press Militar Sentado con Mancuernas',
      slug: 'press-militar-mancuernas',
      description: 'Constructor principal del deltoides anterior y fuerza de empuje vertical.',
      instructions: 'Espalda recta en banco vertical. Empuja las mancuernas sobre la cabeza sin arquear la zona lumbar.',
      equipment: 'Mancuernas',
      difficulty: 'Intermedio',
      defaultSets: 4,
      defaultReps: 10,
      defaultRest: 75,
      muscles: [{ slug: 'hombros', isPrimary: true }, { slug: 'triceps', isPrimary: false }],
    },
    {
      name: 'Elevaciones Laterales con Mancuernas',
      slug: 'elevaciones-laterales-mancuernas',
      description: 'Clave para la anchura del hombro (deltoides lateral).',
      instructions: 'Codos ligeramente flexionados, eleva hacia los laterales hasta la altura de los hombros sin balancear el torso.',
      equipment: 'Mancuernas',
      difficulty: 'Principiante',
      defaultSets: 4,
      defaultReps: 15,
      defaultRest: 45,
      muscles: [{ slug: 'hombros', isPrimary: true }],
    },
    {
      name: 'Elevaciones Laterales en Polea Baja',
      slug: 'elevaciones-laterales-polea',
      description: 'Tensión constante durante todo el rango de movimiento.',
      instructions: 'Cruza la polea por detrás o delante de tu cuerpo y eleva hacia el lateral con trayectoria limpia.',
      equipment: 'Polea',
      difficulty: 'Intermedio',
      defaultSets: 3,
      defaultReps: 15,
      defaultRest: 45,
      muscles: [{ slug: 'hombros', isPrimary: true }],
    },
    {
      name: 'Pájaros / Deltoides Posterior en Peck Deck Inverso',
      slug: 'peck-deck-inverso-pajaros',
      description: 'Crucial para la postura y el hombro posterior.',
      instructions: 'Pecho contra el respaldo. Abre los brazos hacia atrás dirigiendo con los codos.',
      equipment: 'Máquina',
      difficulty: 'Principiante',
      defaultSets: 4,
      defaultReps: 15,
      defaultRest: 45,
      muscles: [{ slug: 'hombros', isPrimary: true }, { slug: 'espalda', isPrimary: false }],
    },

    // BÍCEPS
    {
      name: 'Curl de Bíceps con Barra Z',
      slug: 'curl-biceps-barra-z',
      description: 'Excelente para sobrecarga de bíceps cuidando las muñecas.',
      instructions: 'Codos pegados a los costados, flexiona la barra hasta la altura del pecho sin balancear el torso.',
      equipment: 'Barra y Discos',
      difficulty: 'Principiante',
      defaultSets: 4,
      defaultReps: 10,
      defaultRest: 60,
      muscles: [{ slug: 'biceps', isPrimary: true }],
    },
    {
      name: 'Curl Martillo con Mancuernas',
      slug: 'curl-martillo-mancuernas',
      description: 'Engrosa los brazos trabajando el braquial anterior y antebrazo.',
      instructions: 'Palmas enfrentadas (agarre neutro). Sube controlado alternando o simultáneo.',
      equipment: 'Mancuernas',
      difficulty: 'Principiante',
      defaultSets: 3,
      defaultReps: 12,
      defaultRest: 60,
      muscles: [{ slug: 'biceps', isPrimary: true }],
    },
    {
      name: 'Curl en Polea Baja con Barra Recta',
      slug: 'curl-polea-baja',
      description: 'Tensión continua sin punto muerto de descanso.',
      instructions: 'De pie frente a la polea, tira con los codos fijos y aprieta en la cima 1 segundo.',
      equipment: 'Polea',
      difficulty: 'Principiante',
      defaultSets: 3,
      defaultReps: 12,
      defaultRest: 45,
      muscles: [{ slug: 'biceps', isPrimary: true }],
    },

    // TRÍCEPS
    {
      name: 'Extensión de Tríceps en Polea con Cuerda',
      slug: 'extension-triceps-cuerda-polea',
      description: 'Permite abrir la cuerda al final para máxima contracción de las 3 cabezas.',
      instructions: 'Codos pegados al cuerpo, empuja hacia abajo y abre los extremos de la cuerda al final del recorrido.',
      equipment: 'Polea',
      difficulty: 'Principiante',
      defaultSets: 4,
      defaultReps: 12,
      defaultRest: 45,
      muscles: [{ slug: 'triceps', isPrimary: true }],
    },
    {
      name: 'Press Francés con Barra Z en Banco Plano',
      slug: 'press-frances-barra-z',
      description: 'Constructor masivo para la cabeza larga del tríceps.',
      instructions: 'Acostado en banco, baja la barra Z hacia la frente o detrás de la cabeza flexionando solo los codos.',
      equipment: 'Barra y Discos',
      difficulty: 'Intermedio',
      defaultSets: 3,
      defaultReps: 10,
      defaultRest: 60,
      muscles: [{ slug: 'triceps', isPrimary: true }],
    },
    {
      name: 'Fondos entre Bancos o en Paralelas',
      slug: 'fondos-paralelas-triceps',
      description: 'Trabajo con peso corporal con gran estímulo de empuje.',
      instructions: 'Mantén el cuerpo vertical para focalizar tríceps (no inclines hacia adelante para no pasar a pecho).',
      equipment: 'Peso Corporal',
      difficulty: 'Intermedio',
      defaultSets: 3,
      defaultReps: 10,
      defaultRest: 60,
      muscles: [{ slug: 'triceps', isPrimary: true }, { slug: 'pecho', isPrimary: false }],
    },

    // ABDOMEN
    {
      name: 'Crunch en Polea Alta (Arrodillado)',
      slug: 'crunch-polea-alta-arrodillado',
      description: 'Permite sobrecarga progresiva real para los abdominales.',
      instructions: 'Sujeta la cuerda junto a las orejas. Enróllate hacia las rodillas flexionando la columna, no las caderas.',
      equipment: 'Polea',
      difficulty: 'Intermedio',
      defaultSets: 4,
      defaultReps: 15,
      defaultRest: 45,
      muscles: [{ slug: 'abdomen', isPrimary: true }],
    },
    {
      name: 'Elevación de Piernas Colgado en Barra o Torre',
      slug: 'elevacion-piernas-torre',
      description: 'Gran trabajo para la porción inferior del recto abdominal y flexores.',
      instructions: 'Eleva las rodillas o piernas rectas enrollando la pelvis hacia el ombligo sin balanceos.',
      equipment: 'Máquina',
      difficulty: 'Intermedio',
      defaultSets: 3,
      defaultReps: 12,
      defaultRest: 45,
      muscles: [{ slug: 'abdomen', isPrimary: true }],
    },
    {
      name: 'Plancha Abdominal Estática',
      slug: 'plancha-abdominal-estatica',
      description: 'Fuerza isométrica y resistencia de todo el cinturón lumbopélvico.',
      instructions: 'Antebrazos en el suelo, cuerpo en línea recta sin que caiga la cadera. Aprieta glúteos y abdomen.',
      equipment: 'Peso Corporal',
      difficulty: 'Principiante',
      defaultSets: 3,
      defaultReps: 45, // segundos
      defaultRest: 45,
      muscles: [{ slug: 'abdomen', isPrimary: true }],
    },

    // PANTORRILLAS
    {
      name: 'Elevación de Talones en Máquina de Pie',
      slug: 'elevacion-talones-pie-maquina',
      description: 'Enfoca los gemelos (gastrocnemio) con rodillas extendidas.',
      instructions: 'Puntera de los pies en el escalón. Desciende al máximo para estirar y sube explosivo contrayendo arriba.',
      equipment: 'Máquina',
      difficulty: 'Principiante',
      defaultSets: 4,
      defaultReps: 15,
      defaultRest: 45,
      muscles: [{ slug: 'pantorrillas', isPrimary: true }],
    },
    {
      name: 'Elevación de Talones Sentado en Máquina',
      slug: 'elevacion-talones-sentado-soleo',
      description: 'Al estar las rodillas a 90 grados, aísla de forma directa el músculo sóleo.',
      instructions: 'Baja sintiendo el estiramiento en el tendón de Aquiles y sube con control.',
      equipment: 'Máquina',
      difficulty: 'Principiante',
      defaultSets: 4,
      defaultReps: 15,
      defaultRest: 45,
      muscles: [{ slug: 'pantorrillas', isPrimary: true }],
    },
  ];

  const exerciseMap: Record<string, string> = {};

  for (const ex of exercisesData) {
    const createdEx = await prisma.exercise.create({
      data: {
        name: ex.name,
        slug: ex.slug,
        description: ex.description,
        instructions: ex.instructions,
        equipment: ex.equipment,
        difficulty: ex.difficulty,
        defaultSets: ex.defaultSets,
        defaultReps: ex.defaultReps,
        defaultRest: ex.defaultRest,
      },
    });
    exerciseMap[ex.slug] = createdEx.id;

    for (const m of ex.muscles) {
      const mId = muscleMap[m.slug];
      if (mId) {
        await prisma.exerciseMuscle.create({
          data: {
            exerciseId: createdEx.id,
            muscleGroupId: mId,
            isPrimary: m.isPrimary,
          },
        });
      }
    }
  }
  console.log(`✓ ${exercisesData.length} ejercicios creados con sus músculos asignados`);

  // 5. Crear Rutina Plantilla Oficial del Entrenador "Push A"
  const pushARoutine = await prisma.routine.create({
    data: {
      name: 'Push A (Empuje Clásico)',
      description: 'Rutina oficial de Emporio enfocada en pecho, hombro y tríceps.',
      isTemplate: true,
      targetGender: 'MALE',
      exercises: {
        create: [
          { exerciseId: exerciseMap['press-banca-plano-barra'], order: 1, sets: 4, reps: 10, weightKg: 60, restSeconds: 90 },
          { exerciseId: exerciseMap['press-inclinado-mancuernas'], order: 2, sets: 4, reps: 10, weightKg: 22, restSeconds: 60 },
          { exerciseId: exerciseMap['peck-deck-aperturas'], order: 3, sets: 3, reps: 12, weightKg: 45, restSeconds: 60 },
          { exerciseId: exerciseMap['elevaciones-laterales-mancuernas'], order: 4, sets: 4, reps: 12, weightKg: 10, restSeconds: 45 },
          { exerciseId: exerciseMap['extension-triceps-cuerda-polea'], order: 5, sets: 4, reps: 12, weightKg: 25, restSeconds: 45 },
        ],
      },
    },
  });

  // 6. Crear Rutina Plantilla Oficial "Glúteo & Isquios Focus"
  const gluteRoutine = await prisma.routine.create({
    data: {
      name: 'Glúteo & Isquios Intenso',
      description: 'Rutina oficial de Emporio enfocada en hipertrofia de tren inferior y glúteos.',
      isTemplate: true,
      targetGender: 'FEMALE',
      exercises: {
        create: [
          { exerciseId: exerciseMap['hip-thrust-barra'], order: 1, sets: 4, reps: 10, weightKg: 50, restSeconds: 90 },
          { exerciseId: exerciseMap['prensa-inclinada-45'], order: 2, sets: 4, reps: 12, weightKg: 80, restSeconds: 75 },
          { exerciseId: exerciseMap['peso-muerto-rumano'], order: 3, sets: 4, reps: 10, weightKg: 35, restSeconds: 75 },
          { exerciseId: exerciseMap['patada-gluteo-polea'], order: 4, sets: 3, reps: 15, weightKg: 15, restSeconds: 45 },
          { exerciseId: exerciseMap['maquina-abductores-sentada'], order: 5, sets: 4, reps: 15, weightKg: 40, restSeconds: 45 },
        ],
      },
    },
  });

  // 7. Crear Usuarios de Prueba
  const jorge = await prisma.user.create({
    data: {
      name: 'Jorge',
      gender: 'MALE',
      role: 'MEMBER',
    },
  });

  const valeria = await prisma.user.create({
    data: {
      name: 'Valeria',
      gender: 'FEMALE',
      role: 'MEMBER',
    },
  });

  // Asignarle rutina a Jorge
  await prisma.userAssignedRoutine.create({
    data: {
      userId: jorge.id,
      routineId: pushARoutine.id,
      isCustomized: false,
    },
  });

  // Asignarle rutina a Valeria
  await prisma.userAssignedRoutine.create({
    data: {
      userId: valeria.id,
      routineId: gluteRoutine.id,
      isCustomized: false,
    },
  });

  console.log('✓ Usuarios demo creados: Jorge (MALE) y Valeria (FEMALE) con rutinas asignadas');
  console.log('🎉 Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
