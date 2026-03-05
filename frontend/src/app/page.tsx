"use client";

import { useEffect, useState, useCallback } from "react";
import { Contact, fetchContacts, createContact, deleteContact } from "@/lib/api";

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchContacts(search || undefined);
      setContacts(data);
      setError(null);
    } catch {
      setError("Failed to load contacts. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      await createContact({
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        company: formData.get("company") as string,
        phone: formData.get("phone") as string,
      });
      form.reset();
      setShowForm(false);
      load();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this contact?")) return;
    try {
      await deleteContact(id);
      load();
    } catch {
      setError("Failed to delete contact");
    }
  };

  const statusColor: Record<string, string> = {
    active: "#22c55e",
    inactive: "#94a3b8",
    lead: "#f59e0b",
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 6,
            border: "1px solid #ddd",
            fontSize: 14,
          }}
        />
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "10px 20px",
            background: "#1a1a2e",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          {showForm ? "Cancel" : "+ New Contact"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            background: "white",
            padding: 20,
            borderRadius: 8,
            marginBottom: 20,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <input name="name" placeholder="Name *" required style={inputStyle} />
          <input name="email" placeholder="Email *" required type="email" style={inputStyle} />
          <input name="company" placeholder="Company" style={inputStyle} />
          <input name="phone" placeholder="Phone" style={inputStyle} />
          <button
            type="submit"
            style={{
              gridColumn: "1 / -1",
              padding: "10px",
              background: "#22c55e",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Create Contact
          </button>
        </form>
      )}

      {error && (
        <div style={{ background: "#fee2e2", color: "#dc2626", padding: 12, borderRadius: 6, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : contacts.length === 0 ? (
        <p style={{ color: "#666" }}>No contacts found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {contacts.map((c) => (
            <div
              key={c.id}
              style={{
                background: "white",
                padding: "16px 20px",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{c.name}</div>
                <div style={{ color: "#666", fontSize: 14 }}>
                  {c.email}
                  {c.company && ` - ${c.company}`}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    background: statusColor[c.status] || "#94a3b8",
                    color: "white",
                    padding: "4px 10px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {c.status}
                </span>
                <button
                  onClick={() => handleDelete(c.id)}
                  style={{
                    background: "none",
                    border: "1px solid #ddd",
                    borderRadius: 6,
                    padding: "6px 12px",
                    cursor: "pointer",
                    color: "#dc2626",
                    fontSize: 13,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 6,
  border: "1px solid #ddd",
  fontSize: 14,
};
