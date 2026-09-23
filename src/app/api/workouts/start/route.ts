import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getMemberId, unauthorized } from '@/lib/auth';
import {
  boundedNumber,
  readJsonObject,
  RequestValidationError,
  requiredString,
  validationError,
} from '@/lib/validation';

type WorkoutExerciseInput = {
  exerciseId: string;
  sets: number;
  reps: number;
  weightKg: number;
  restSeconds: number;
};

export async function POST(req: NextRequest) {
  try {
    const userId = getMemberId(req);
    if (!userId) return unauthorized('Debés iniciar sesión con tu nombre');

    const body = await readJsonObject(req);
    const name = requiredString(body.name || 'Entrenamiento del día', 'El nombre', 100);
    const routineId = body.routineId ? requiredString(body.routineId, 'routineId', 80) : null;

    if (!Array.isArray(body.exercises) || body.exercises.length < 1 || body.exercises.length > 20) {
      return NextResponse.json({ error: 'Incluí entre 1 y 20 ejercicios' }, { status: 400 });
    }

    const exercises: WorkoutExerciseInput[] = body.exercises.map((value, index) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new RequestValidationError(`Ejercicio ${index + 1} inválido`);
      }
      const item = value as Record<string, unknown>;
      return {
        exerciseId: requiredString(item.exerciseId, `exerciseId ${index + 1}`, 80),
        sets: Math.trunc(boundedNumber(item.sets, 'Series', 1, 10, 4)),
        reps: Math.trunc(boundedNumber(item.reps, 'Repeticiones', 1, 100, 10)),
        weightKg: boundedNumber(item.weightKg, 'Peso', 0, 1000, 0),
        restSeconds: Math.trunc(boundedNumber(item.restSeconds, 'Descanso', 0, 600, 60)),
      };
    });

    const exerciseIds = [...new Set(exercises.map((item) => item.exerciseId))];
    if (exerciseIds.length !== exercises.length) {
      return NextResponse.json({ error: 'No repitas ejercicios en la misma sesión' }, { status: 400 });
    }

    const [validExercises, routine] = await Promise.all([
      db.exercise.count({ where: { id: { in: exerciseIds } } }),
      routineId
        ? db.routine.findFirst({
            where: {
              id: routineId,
              OR: [
                { isTemplate: true },
                { createdById: userId },
                { assignments: { some: { userId } } },
              ],
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (validExercises !== exerciseIds.length || (routineId && !routine)) {
      return NextResponse.json({ error: 'Rutina o ejercicios inválidos' }, { status: 400 });
    }

    const session = await db.workoutSession.create({
      data: {
        userId,
        routineId,
        name,
        exercises: {
          create: exercises.map((item, exIdx) => ({
            exerciseId: item.exerciseId,
            order: exIdx + 1,
            restSeconds: item.restSeconds,
            sets: {
              create: Array.from({ length: item.sets }, (_, setIdx) => ({
                setNumber: setIdx + 1,
                plannedReps: item.reps,
                plannedWeightKg: item.weightKg,
                actualReps: item.reps,
                actualWeightKg: item.weightKg,
                completed: false,
              })),
            },
          })),
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true, sessionId: session.id }, { status: 201 });
  } catch (error) {
    console.error('Error al iniciar entrenamiento:', error);
    return validationError(error, 'Error al iniciar entrenamiento');
  }
}
