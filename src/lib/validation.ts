import { NextRequest, NextResponse } from 'next/server';

export class RequestValidationError extends Error {}

export async function readJsonObject(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new RequestValidationError('Content-Type debe ser application/json');
  }

  let value: unknown;
  try {
    value = await req.json();
  } catch {
    throw new RequestValidationError('El cuerpo JSON es inválido');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RequestValidationError('Solicitud inválida');
  }

  return value as Record<string, unknown>;
}

export function requiredString(value: unknown, field: string, maxLength = 120) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new RequestValidationError(`${field} es obligatorio`);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new RequestValidationError(`${field} es demasiado largo`);
  }

  return normalized;
}

export function optionalString(value: unknown, field: string, maxLength = 1000) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new RequestValidationError(`${field} debe ser texto`);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new RequestValidationError(`${field} es demasiado largo`);
  }
  return normalized;
}

export function boundedNumber(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
  fallback?: number,
) {
  if ((value === undefined || value === null || value === '') && fallback !== undefined) {
    return fallback;
  }

  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) {
    throw new RequestValidationError(`${field} debe estar entre ${minimum} y ${maximum}`);
  }
  return number;
}

export function validationError(error: unknown, fallback: string) {
  if (error instanceof RequestValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ error: fallback }, { status: 500 });
}
