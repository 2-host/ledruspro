import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const c = await cookies();
  c.set("edit_token", "", {
    path: "/",
    httpOnly: true,
    maxAge: 0,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const base = process.env.NEXT_PUBLIC_SITE_URL!;
  return NextResponse.redirect(new URL("/", base));
}
