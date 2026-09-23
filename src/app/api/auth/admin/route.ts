import { NextRequest, NextResponse } from 'next/server';
import {
  clearAdminSession,
  isAdminAuthenticated,
  safeCompare,
  setAdminSession,
} from '@/lib/auth';
import { readJsonObject, requiredString, validationError } from '@/lib/validation';

const failedAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function clientKey(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}

export async function POST(req: NextRequest) {
  try {
    const key = clientKey(req);
    const now = Date.now();
    const attempt = failedAttempts.get(key);
    if (attempt && attempt.resetAt > now && attempt.count >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Probá nuevamente en 15 minutos.' },
        { status: 429 },
      );
    }

    const body = await readJsonObject(req);
    const password = requiredString(body.password, 'La contraseña', 200);
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD no está configurado');
      return NextResponse.json({ error: 'Acceso administrativo no configurado' }, { status: 503 });
    }

    if (!safeCompare(password, adminPassword)) {
      failedAttempts.set(key, {
        count: attempt && attempt.resetAt > now ? attempt.count + 1 : 1,
        resetAt: attempt && attempt.resetAt > now ? attempt.resetAt : now + WINDOW_MS,
      });
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    failedAttempts.delete(key);
    const response = NextResponse.json({ success: true });
    setAdminSession(response);
    return response;
  } catch (error) {
    return validationError(error, 'Error al procesar la solicitud');
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ authenticated: isAdminAuthenticated(req) });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearAdminSession(response);
  return response;
}
