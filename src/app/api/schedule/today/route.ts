import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getMemberId } from '@/lib/auth';

const dayIndexes: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export async function GET(req: NextRequest) {
  try {
    const userId = getMemberId(req);
    let userGender = 'MALE';
    let assignedRoutine = null;
    let userName = 'Atleta';

    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          assignedRoutines: {
            include: {
              routine: {
                include: {
                  exercises: { include: { exercise: true }, orderBy: { order: 'asc' } },
                },
              },
            },
            orderBy: { assignedAt: 'desc' },
            take: 1,
          },
        },
      });
      if (user) {
        userGender = user.gender;
        userName = user.name;
        assignedRoutine = user.assignedRoutines[0]?.routine || null;
      }
    }

    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Asuncion',
      weekday: 'short',
    }).format(new Date());
    const dayOfWeek = dayIndexes[weekday] ?? 0;

    const schedule = await db.weeklySchedule.findUnique({
      where: { dayOfWeek_gender: { dayOfWeek, gender: userGender } },
    });

    const slugs = schedule?.muscleGroupSlugs
      ? schedule.muscleGroupSlugs.split(',').map((slug) => slug.trim()).filter(Boolean)
      : [];
    let recommendedExercises = slugs.length
      ? await db.exercise.findMany({
          where: {
            muscles: {
              some: { muscleGroup: { slug: { in: slugs } }, isPrimary: true },
            },
          },
          include: { muscles: { include: { muscleGroup: true } } },
          orderBy: { name: 'asc' },
          take: 6,
        })
      : [];

    // Evita una pantalla vacía si una programación está incompleta o sus
    // ejercicios todavía no fueron vinculados a un grupo muscular.
    if (recommendedExercises.length === 0) {
      recommendedExercises = await db.exercise.findMany({
        include: { muscles: { include: { muscleGroup: true } } },
        orderBy: { name: 'asc' },
        take: 5,
      });
    }

    return NextResponse.json({
      dayOfWeek,
      userName,
      userGender,
      schedule,
      recommendedExercises,
      assignedRoutine,
    });
  } catch (error) {
    console.error('Error en /api/schedule/today:', error);
    return NextResponse.json({ error: 'Error al obtener la recomendación de hoy' }, { status: 500 });
  }
}
