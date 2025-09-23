// src/lib/adminAuth.ts
import { cookies } from 'next/headers';

export function getSessionSecret(): string {
  const secret = (process.env.ADMIN_SESSION_SECRET || '').trim();
  if (!secret) {
    // в дев-режиме можно подставить дефолт
    if (process.env.NODE_ENV !== 'production') {
      return 'dev-admin-secret';
    }
    throw new Error('ADMIN_SESSION_SECRET is not set');
  }
  return secret;
}

export function isAdminServer(): boolean {
  const c = cookies();
  const token = c.get('admin_session')?.value ?? null;
  return token === getSessionSecret();
}
