import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated, unauthorized } from '@/lib/auth';
import { optionalString, readJsonObject, requiredString, validationError } from '@/lib/validation';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdminAuthenticated(req)) return unauthorized();
    const { id } = await params;
    const body = await readJsonObject(req);
    const name = requiredString(body.name, 'El nombre', 100);

    const exercise = await db.exercise.update({
      where: { id },
      data: {
        name,
        ...(body.description !== undefined && {
          description: optionalString(body.description, 'La descripción', 1000),
        }),
        ...(body.equipment !== undefined && {
          equipment: requiredString(body.equipment, 'El equipamiento', 60),
        }),
        ...(body.difficulty !== undefined && {
          difficulty: requiredString(body.difficulty, 'La dificultad', 30),
        }),
        ...(body.instructions !== undefined && {
          instructions: optionalString(body.instructions, 'Las instrucciones', 3000),
        }),
      },
      include: { muscles: { include: { muscleGroup: true } } },
    });
    return NextResponse.json({ success: true, exercise });
  } catch (error) {
    console.error('Error al actualizar ejercicio:', error);
    return validationError(error, 'Error al actualizar el ejercicio');
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const exercise = await db.exercise.findUnique({
      where: { id },
      include: { muscles: { include: { muscleGroup: true } } },
    });
    if (!exercise) return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 });
    return NextResponse.json({ exercise });
  } catch (error) {
    console.error('Error al obtener ejercicio:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
