import { NextResponse } from 'next/server';
import { clearMemberSession } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearMemberSession(response);
  return response;
}
