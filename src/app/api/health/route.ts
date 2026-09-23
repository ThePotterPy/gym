import { NextResponse } from 'next/server';

import { db } from '@/lib/db';

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Healthcheck de base de datos fallido:', error);
    return NextResponse.json({ status: 'error' }, { status: 503 });
  }
}
