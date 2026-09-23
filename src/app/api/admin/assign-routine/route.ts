import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated, unauthorized } from '@/lib/auth';
import { readJsonObject, requiredString, validationError } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    if (!isAdminAuthenticated(req)) return unauthorized();

    const body = await readJsonObject(req);
    const userId = requiredString(body.userId, 'userId', 80);
    const routineId = body.routineId ? requiredString(body.routineId, 'routineId', 80) : null;

    const [user, routine] = await Promise.all([
      db.user.findFirst({ where: { id: userId, role: 'MEMBER' }, select: { id: true } }),
      routineId
        ? db.routine.findFirst({ where: { id: routineId, isTemplate: true }, select: { id: true } })
        : Promise.resolve(null),
    ]);

    if (!user || (routineId && !routine)) {
      return NextResponse.json({ error: 'Socio o rutina inválidos' }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      await tx.userAssignedRoutine.deleteMany({ where: { userId } });
      if (routineId) {
        await tx.userAssignedRoutine.create({
          data: { userId, routineId, isCustomized: false },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al asignar rutina:', error);
    return validationError(error, 'Error al asignar rutina');
  }
}
