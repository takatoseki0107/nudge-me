import api from "./api";

export interface AuthUser {
  id: string;
  email: string;
}

export async function register(email: string, password: string): Promise<AuthUser> {
  const res = await api.post<AuthUser>("/auth/register", { email, password });
  return res.data;
}

export async function login(
  email: string,
  password: string
): Promise<{ token: string; user: AuthUser }> {
  const res = await api.post<{ token: string; user: AuthUser }>("/auth/login", {
    email,
    password,
  });
  return res.data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
  localStorage.removeItem("nudge_token");
}

export function saveToken(token: string): void {
  localStorage.setItem("nudge_token", token);
}

export function getToken(): string | null {
  return localStorage.getItem("nudge_token");
}

export function clearToken(): void {
  localStorage.removeItem("nudge_token");
}
