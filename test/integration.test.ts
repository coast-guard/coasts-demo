const API_BASE = process.env.API_URL || "http://localhost:4000/api";

interface Contact {
  id: number;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  status: string;
}

async function request(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
}

let createdIds: number[] = [];

async function cleanup() {
  for (const id of createdIds) {
    try {
      await request(`/contacts/${id}`, { method: "DELETE" });
    } catch {}
  }
  createdIds = [];
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  PASS: ${name}`);
  } catch (err) {
    console.error(`  FAIL: ${name}`);
    console.error(`    ${err}`);
    process.exitCode = 1;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

async function run() {
  console.log("\nIntegration Tests");
  console.log("=================\n");

  // Wait for backend to be ready
  console.log("Waiting for backend...");
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }

  const healthRes = await fetch(`${API_BASE}/health`);
  if (!healthRes.ok) {
    console.error("Backend not reachable at", API_BASE);
    process.exit(1);
  }
  console.log("Backend is ready.\n");

  await test("GET /api/health returns ok", async () => {
    const res = await request("/health");
    assertEqual(res.status, 200, "status");
    const json = await res.json();
    assertEqual(json.status, "ok", "body.status");
  });

  await test("GET /api/contacts returns a list", async () => {
    const res = await request("/contacts");
    assertEqual(res.status, 200, "status");
    const json = await res.json();
    assert(Array.isArray(json.data), "data should be an array");
  });

  await test("POST /api/contacts creates a contact", async () => {
    const res = await request("/contacts", {
      method: "POST",
      body: JSON.stringify({
        contact: {
          name: "Test User",
          email: `test-${Date.now()}@example.com`,
          company: "Test Co",
          phone: "555-9999",
        },
      }),
    });
    assertEqual(res.status, 201, "status");
    const json = await res.json();
    assert(json.data.id > 0, "should have an id");
    assertEqual(json.data.name, "Test User", "name");
    assertEqual(json.data.status, "active", "default status");
    createdIds.push(json.data.id);
  });

  await test("POST /api/contacts validates required fields", async () => {
    const res = await request("/contacts", {
      method: "POST",
      body: JSON.stringify({ contact: { company: "No Name Co" } }),
    });
    assertEqual(res.status, 422, "status");
    const json = await res.json();
    assert(json.errors.name !== undefined, "should have name error");
    assert(json.errors.email !== undefined, "should have email error");
  });

  await test("GET /api/contacts/:id returns a single contact", async () => {
    const id = createdIds[0];
    const res = await request(`/contacts/${id}`);
    assertEqual(res.status, 200, "status");
    const json = await res.json();
    assertEqual(json.data.id, id, "id");
  });

  await test("PUT /api/contacts/:id updates a contact", async () => {
    const id = createdIds[0];
    const res = await request(`/contacts/${id}`, {
      method: "PUT",
      body: JSON.stringify({ contact: { name: "Updated User", status: "lead" } }),
    });
    assertEqual(res.status, 200, "status");
    const json = await res.json();
    assertEqual(json.data.name, "Updated User", "name");
    assertEqual(json.data.status, "lead", "status");
  });

  await test("GET /api/contacts?q=Updated searches contacts", async () => {
    const res = await request("/contacts?q=Updated");
    assertEqual(res.status, 200, "status");
    const json = await res.json();
    assert(json.data.length > 0, "should find results");
    assert(
      json.data.some((c: Contact) => c.name === "Updated User"),
      "should include updated contact"
    );
  });

  await test("GET /api/contacts/:id returns 404 for missing", async () => {
    const res = await request("/contacts/999999");
    assertEqual(res.status, 404, "status");
  });

  await test("DELETE /api/contacts/:id removes a contact", async () => {
    const id = createdIds.pop()!;
    const res = await request(`/contacts/${id}`, { method: "DELETE" });
    assertEqual(res.status, 204, "status");

    const getRes = await request(`/contacts/${id}`);
    assertEqual(getRes.status, 404, "should be gone");
  });

  await cleanup();
  console.log("\nDone.\n");
}

run();
