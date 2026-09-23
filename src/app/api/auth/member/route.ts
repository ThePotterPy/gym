import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getMemberId, setMemberSession } from '@/lib/auth';
import { readJsonObject, requiredString, validationError } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonObject(req);
    const rawName = requiredString(body.name, 'El nombre', 60);
    const gender = body.gender === 'MALE' || body.gender === 'FEMALE' ? body.gender : undefined;

    const existingUser = await db.user.findFirst({
      where: { name: { equals: rawName } },
    });

    if (existingUser) {
      const response = NextResponse.json({ success: true, user: existingUser });
      setMemberSession(response, existingUser.id);
      return response;
    }

    if (!gender) {
      return NextResponse.json({
        requiresGender: true,
        name: rawName,
        message: 'Seleccioná tu perfil para adaptar tus entrenamientos',
      });
    }

    const newUser = await db.user.create({
      data: { name: rawName, gender, role: 'MEMBER' },
    });

    const response = NextResponse.json({ success: true, user: newUser });
    setMemberSession(response, newUser.id);
    return response;
  } catch (error) {
    console.error('Error en auth/member:', error);
    return validationError(error, 'Error al iniciar sesión');
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = getMemberId(req);
    if (!userId) return NextResponse.json({ user: null });

    const user = await db.user.findUnique({ where: { id: userId } });
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error en GET auth/member:', error);
    return NextResponse.json({ user: null });
  }
}
