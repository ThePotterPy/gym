import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getMemberId, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getMemberId(req);
    if (!userId) return unauthorized();
    const { id } = await params;

    const session = await db.workoutSession.findFirst({
      where: { id, userId },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: { orderBy: { setNumber: 'asc' } },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!session) return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error al obtener sesión:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
