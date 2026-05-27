// lib/auth/session.ts — non-secret routing hint for Next.js proxy on localhost:4000
import Cookies from "js-cookie";
import { COOKIE_KEYS } from "@/config/constants";

const SESSION_VALUE = "1";

export function setSessionFlag(): void {
  Cookies.set(COOKIE_KEYS.SESSION_FLAG, SESSION_VALUE, {
    expires: 7,
    sameSite: "lax",
    path: "/",
  });
}

export function clearSessionFlag(): void {
  Cookies.remove(COOKIE_KEYS.SESSION_FLAG, { path: "/" });
}

export function hasSessionFlag(): boolean {
  return Cookies.get(COOKIE_KEYS.SESSION_FLAG) === SESSION_VALUE;
}
