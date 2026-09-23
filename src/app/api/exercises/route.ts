import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const muscleSlug = url.searchParams.get('muscle');
    const equipment = url.searchParams.get('equipment');
    const query = url.searchParams.get('q')?.trim();

    const whereClause: any = {};

    if (query) {
      whereClause.OR = [
        { name: { contains: query } },
        { description: { contains: query } },
      ];
    }

    if (equipment && equipment !== 'Todos') {
      whereClause.equipment = equipment;
    }

    if (muscleSlug) {
      whereClause.muscles = {
        some: {
          muscleGroup: {
            slug: muscleSlug,
          },
        },
      };
    }

    const exercises = await db.exercise.findMany({
      where: whereClause,
      include: {
        muscles: {
          include: {
            muscleGroup: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ exercises });
  } catch (error) {
    console.error('Error en /api/exercises:', error);
    return NextResponse.json({ error: 'Error al buscar ejercicios' }, { status: 500 });
  }
}
