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

const API_BASE = "/api";

export async function fetchContacts(query?: string): Promise<Contact[]> {
  const url = query ? `${API_BASE}/contacts?q=${encodeURIComponent(query)}` : `${API_BASE}/contacts`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch contacts");
  const json = await res.json();
  return json.data;
}

export async function fetchContact(id: number): Promise<Contact> {
  const res = await fetch(`${API_BASE}/contacts/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch contact");
  const json = await res.json();
  return json.data;
}

export async function createContact(data: Partial<Contact>): Promise<Contact> {
  const res = await fetch(`${API_BASE}/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(`${API_BASE}/contacts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete contact");
}
