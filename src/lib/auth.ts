import "server-only";

import { createHash } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const sessionCookieName = "khaza-scoop-session";

function getCredentials() {
  return {
    email: process.env.AUTH_EMAIL ?? "admin@khazascoop.local",
    password: process.env.AUTH_PASSWORD ?? "khaza123",
  };
}

function createSessionToken(email: string, password: string) {
  return createHash("sha256").update(`${email}:${password}`).digest("hex");
}

export function getDefaultCredentials() {
  return getCredentials();
}

export async function loginOwner(email: string, password: string) {
  const credentials = getCredentials();

  if (email !== credentials.email || password !== credentials.password) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, createSessionToken(email, password), {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return true;
}

export async function logoutOwner() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get(sessionCookieName)?.value;
  const credentials = getCredentials();

  return session === createSessionToken(credentials.email, credentials.password);
}

export async function requireAuth() {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
}
