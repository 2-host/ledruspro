// src/lib/magic.ts
import { SignJWT, jwtVerify, JWTPayload } from 'jose';

const secret = new TextEncoder().encode(process.env.EDIT_TOKEN_SECRET || 'dev-secret');
const alg = 'HS256';

type EmailTokenPayload = { email: string; t: number }; // t = issued at (ms)
type EditTokenPayload  = { email: string; pid: number; t: number };

export async function signEmailToken(email: string, ttlSec = 24 * 30 * 60) {
  const nowSec = Math.floor(Date.now() / 1000);
  return await new SignJWT({ email, t: Date.now() } as EmailTokenPayload)
    .setProtectedHeader({ alg })
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + ttlSec)
    .sign(secret);
}

export async function verifyEmailToken(token: string) {
  const { payload } = await jwtVerify(token, secret, { algorithms: [alg] });
  return payload as JWTPayload & EmailTokenPayload;
}

export async function signEditToken(email: string, pid: number, ttlSec = 24 * 60 * 60) {
  const nowSec = Math.floor(Date.now() / 1000);
  return await new SignJWT({ email, pid, t: Date.now() } as EditTokenPayload)
    .setProtectedHeader({ alg })
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + ttlSec)
    .sign(secret);
}

export async function verifyEditToken(token: string) {
  const { payload } = await jwtVerify(token, secret, { algorithms: [alg] });
  return payload as JWTPayload & EditTokenPayload;
}

export { verifyEditToken as verifyAuthToken };