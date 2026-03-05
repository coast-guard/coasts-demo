export interface Contact {
  id: number;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  status: string;
  inserted_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

const API_BASE = "/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error || "Login failed");
  }
  const json = await res.json();
  return json.data;
}

export async function register(email: string, password: string, name: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(JSON.stringify(json.errors || json.error));
  }
  const json = await res.json();
  return json.data;
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
  clearToken();
}

export async function fetchMe(): Promise<User> {
  const res = await fetch(`${API_BASE}/me`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Not authenticated");
  const json = await res.json();
  return json.data;
}

export async function fetchContacts(query?: string): Promise<Contact[]> {
  const url = query ? `${API_BASE}/contacts?q=${encodeURIComponent(query)}` : `${API_BASE}/contacts`;
  const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch contacts");
  const json = await res.json();
  return json.data;
}

export async function fetchContact(id: number): Promise<Contact> {
  const res = await fetch(`${API_BASE}/contacts/${id}`, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch contact");
  const json = await res.json();
  return json.data;
}

export async function createContact(data: Partial<Contact>): Promise<Contact> {
  const res = await fetch(`${API_BASE}/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ contact: data }),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(JSON.stringify(json.errors));
  }
  const json = await res.json();
  return json.data;
}

export async function updateContact(id: number, data: Partial<Contact>): Promise<Contact> {
  const res = await fetch(`${API_BASE}/contacts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ contact: data }),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(JSON.stringify(json.errors));
  }
  const json = await res.json();
  return json.data;
}

export async function deleteContact(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/contacts/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete contact");
}
