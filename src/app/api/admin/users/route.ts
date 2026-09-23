import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    if (!isAdminAuthenticated(req)) return unauthorized();

    const users = await db.user.findMany({
      where: { role: 'MEMBER' },
      include: {
        assignedRoutines: {
          include: {
            routine: true,
          },
        },
        _count: {
          select: {
            workoutSessions: true,
          },
        },
        workoutSessions: {
          orderBy: { startedAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error en /api/admin/users:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
