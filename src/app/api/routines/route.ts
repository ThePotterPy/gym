import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getMemberId, unauthorized } from '@/lib/auth';
import {
  boundedNumber,
  optionalString,
  readJsonObject,
  RequestValidationError,
  requiredString,
  validationError,
} from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    const userId = getMemberId(req);
    const user = userId
      ? await db.user.findUnique({ where: { id: userId }, select: { gender: true } })
      : null;

    const templates = await db.routine.findMany({
      where: {
        isTemplate: true,
        ...(user ? { OR: [{ targetGender: null }, { targetGender: 'ALL' }, { targetGender: user.gender }] } : {}),
      },
      include: {
        exercises: { include: { exercise: true }, orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const userRoutines = userId
      ? await db.routine.findMany({
          where: { createdById: userId, isTemplate: false },
          include: {
            exercises: { include: { exercise: true }, orderBy: { order: 'asc' } },
          },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    return NextResponse.json({ templates, userRoutines });
  } catch (error) {
    console.error('Error en /api/routines GET:', error);
    return NextResponse.json({ error: 'Error al obtener rutinas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getMemberId(req);
    if (!userId) return unauthorized();
    const body = await readJsonObject(req);
    const name = requiredString(body.name, 'El nombre', 80);
    const description = optionalString(body.description, 'La descripción', 500);

    if (!Array.isArray(body.exercises) || body.exercises.length < 1 || body.exercises.length > 20) {
      return NextResponse.json({ error: 'Seleccioná entre 1 y 20 ejercicios' }, { status: 400 });
    }

    const exercises = body.exercises.map((value, index) => {
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

    const ids = [...new Set(exercises.map((item) => item.exerciseId))];
    const validCount = await db.exercise.count({ where: { id: { in: ids } } });
    if (ids.length !== exercises.length || validCount !== ids.length) {
      return NextResponse.json({ error: 'La selección de ejercicios es inválida' }, { status: 400 });
    }

    const routine = await db.routine.create({
      data: {
        name,
        description: description || 'Rutina personalizada',
        isTemplate: false,
        createdById: userId,
        exercises: {
          create: exercises.map((item, index) => ({ ...item, order: index + 1 })),
        },
      },
      include: { exercises: { include: { exercise: true }, orderBy: { order: 'asc' } } },
    });

    return NextResponse.json({ success: true, routine }, { status: 201 });
  } catch (error) {
    console.error('Error en /api/routines POST:', error);
    return validationError(error, 'Error al guardar la rutina');
  }
}
