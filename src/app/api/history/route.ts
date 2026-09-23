import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getMemberId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const userId = getMemberId(req);
    if (!userId) {
      return NextResponse.json({ history: [] });
    }

    const sessions = await db.workoutSession.findMany({
      where: {
        userId,
        finishedAt: { not: null },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: true,
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 30,
    });

    return NextResponse.json({ history: sessions });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 });
  }
}
