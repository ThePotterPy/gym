import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const groups = await db.muscleGroup.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { exercises: true },
        },
      },
    });

    return NextResponse.json({ muscleGroups: groups });
  } catch (error) {
    console.error('Error en /api/muscle-groups:', error);
    return NextResponse.json({ error: 'Error al listar grupos musculares' }, { status: 500 });
  }
}
