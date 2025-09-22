import { cookies } from 'next/headers';

export function getSessionSecret(): string {
  // единая точка правды; в dev подставляем дефолт
  return process.env.ADMIN_SESSION_SECRET || 'dev-admin-secret';
}

export async function isAdminServer(): Promise<boolean> {
  const c = await cookies();
  const token = c.get('admin_session')?.value;
  return token === getSessionSecret();
}
