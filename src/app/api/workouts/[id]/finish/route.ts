import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getMemberId, unauthorized } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getMemberId(req);
    if (!userId) return unauthorized();
    const { id } = await params;

    const session = await db.workoutSession.findFirst({ where: { id, userId } });
    if (!session) return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
    if (session.finishedAt) return NextResponse.json({ success: true, session });

    const finishedAt = new Date();
    const durationMinutes = Math.max(
      1,
      Math.min(24 * 60, Math.round((finishedAt.getTime() - session.startedAt.getTime()) / 60000)),
    );
    const updated = await db.workoutSession.update({
      where: { id },
      data: { finishedAt, durationMinutes },
    });
    return NextResponse.json({ success: true, session: updated });
  } catch (error) {
    console.error('Error al finalizar entrenamiento:', error);
    return NextResponse.json({ error: 'Error al finalizar sesión' }, { status: 500 });
  }
}
