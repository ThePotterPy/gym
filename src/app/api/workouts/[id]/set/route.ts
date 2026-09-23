import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getMemberId, unauthorized } from '@/lib/auth';
import { boundedNumber, readJsonObject, requiredString, validationError } from '@/lib/validation';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = getMemberId(req);
    if (!userId) return unauthorized();
    const { id: sessionId } = await params;
    const body = await readJsonObject(req);
    const setId = requiredString(body.setId, 'setId', 80);
    const actualReps = Math.trunc(boundedNumber(body.actualReps, 'Repeticiones', 0, 100));
    const actualWeightKg = boundedNumber(body.actualWeightKg, 'Peso', 0, 1000);
    const completed = body.completed === true;

    const ownedSet = await db.workoutSet.findFirst({
      where: {
        id: setId,
        sessionExercise: { sessionId, session: { userId } },
      },
      select: { id: true },
    });
    if (!ownedSet) return NextResponse.json({ error: 'Serie no encontrada' }, { status: 404 });

    const updatedSet = await db.workoutSet.update({
      where: { id: setId },
      data: { actualReps, actualWeightKg, completed },
    });
    return NextResponse.json({ success: true, set: updatedSet });
  } catch (error) {
    console.error('Error al actualizar serie:', error);
    return validationError(error, 'Error al registrar serie');
  }
}
