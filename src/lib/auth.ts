import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

const MEMBER_COOKIE = 'emporio_member_session';
const ADMIN_COOKIE = 'emporio_admin_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const ADMIN_MAX_AGE = 60 * 60 * 8;

type SessionPayload = {
  sub: string;
  role: 'MEMBER' | 'ADMIN';
  exp: number;
};

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET
    || (process.env.NODE_ENV === 'development' ? process.env.ADMIN_PASSWORD : undefined);

  if (!secret) {
    throw new Error('SESSION_SECRET debe estar configurado');
  }

  return secret;
}

function encode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signatureFor(encodedPayload: string) {
  return createHmac('sha256', getSessionSecret())
    .update(encodedPayload)
    .digest('base64url');
}

function signSession(payload: SessionPayload) {
  const encodedPayload = encode(JSON.stringify(payload));
  return `${encodedPayload}.${signatureFor(encodedPayload)}`;
}

function verifySession(token: string | undefined): SessionPayload | null {
  if (!token) return null;

  const [encodedPayload, providedSignature] = token.split('.');
  if (!encodedPayload || !providedSignature) return null;

  const expectedSignature = signatureFor(encodedPayload);
  const expected = Buffer.from(expectedSignature);
  const provided = Buffer.from(providedSignature);

  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return null;
  }

  try {
    const payload = JSON.parse(decode(encodedPayload)) as SessionPayload;
    if (!payload.sub || !payload.role || payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge,
});

export function setMemberSession(response: NextResponse, userId: string) {
  response.cookies.set(
    MEMBER_COOKIE,
    signSession({
      sub: userId,
      role: 'MEMBER',
      exp: Date.now() + SESSION_MAX_AGE * 1000,
    }),
    cookieOptions(SESSION_MAX_AGE),
  );
  response.cookies.delete('emporio_user_id');
}

export function clearMemberSession(response: NextResponse) {
  response.cookies.delete(MEMBER_COOKIE);
  response.cookies.delete('emporio_user_id');
}

export function getMemberId(req: NextRequest) {
  const session = verifySession(req.cookies.get(MEMBER_COOKIE)?.value);
  return session?.role === 'MEMBER' ? session.sub : null;
}

export function setAdminSession(response: NextResponse) {
  response.cookies.set(
    ADMIN_COOKIE,
    signSession({
      sub: 'admin',
      role: 'ADMIN',
      exp: Date.now() + ADMIN_MAX_AGE * 1000,
    }),
    cookieOptions(ADMIN_MAX_AGE),
  );
  response.cookies.delete('emporio_admin_auth');
}

export function clearAdminSession(response: NextResponse) {
  response.cookies.delete(ADMIN_COOKIE);
  response.cookies.delete('emporio_admin_auth');
}

export function isAdminAuthenticated(req: NextRequest) {
  const session = verifySession(req.cookies.get(ADMIN_COOKIE)?.value);
  return session?.role === 'ADMIN';
}

export function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function unauthorized(message = 'No autorizado') {
  return NextResponse.json({ error: message }, { status: 401 });
}
