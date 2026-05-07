import { api } from "./api";
import type { AuthResponse } from "./types";

const COOKIE_NAME = "ott-token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function register(data: Record<string, unknown>): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/api/auth/register", data);
  return res.data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/api/auth/login", { email, password });
  return res.data;
}

export function saveToken(token: string) {
  localStorage.setItem("token", token);
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function getToken() {
  return localStorage.getItem("token");
}

export function logout() {
  localStorage.removeItem("token");
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}
