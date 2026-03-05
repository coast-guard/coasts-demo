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

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

let createdContactIds: number[] = [];
let testToken: string | null = null;

async function cleanup() {
  if (testToken) {
    for (const id of createdContactIds) {
      try {
        await request(`/contacts/${id}`, { method: "DELETE", headers: authHeader(testToken) });
      } catch {}
    }
  }
  createdContactIds = [];
}

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL: ${name}`);
    console.error(`    ${err}`);
    failed++;
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

  // --- Health ---
  console.log("Health");
  await test("GET /api/health returns ok", async () => {
    const res = await request("/health");
    assertEqual(res.status, 200, "status");
    const json = await res.json();
    assertEqual(json.status, "ok", "body.status");
  });

  // --- Auth: unauthenticated access ---
  console.log("\nAuth - Unauthenticated");
  await test("GET /api/contacts without auth returns 401", async () => {
    const res = await request("/contacts");
    assertEqual(res.status, 401, "status");
    const json = await res.json();
    assertEqual(json.error, "Unauthorized", "error message");
  });

  await test("GET /api/me without auth returns 401", async () => {
    const res = await request("/me");
    assertEqual(res.status, 401, "status");
  });

  await test("POST /api/contacts without auth returns 401", async () => {
    const res = await request("/contacts", {
      method: "POST",
      body: JSON.stringify({ contact: { name: "Test", email: "t@t.com" } }),
    });
    assertEqual(res.status, 401, "status");
  });

  // --- Auth: registration ---
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "password123";
  const testName = "Test User";

  console.log("\nAuth - Registration");
  await test("POST /api/register creates a user and returns token", async () => {
    const res = await request("/register", {
      method: "POST",
      body: JSON.stringify({ email: testEmail, password: testPassword, name: testName }),
    });
    assertEqual(res.status, 201, "status");
    const json = await res.json();
    assert(typeof json.data.token === "string", "should return a token");
    assert(json.data.token.length > 20, "token should be non-trivial");
    assertEqual(json.data.user.email, testEmail, "user email");
    assertEqual(json.data.user.name, testName, "user name");
    testToken = json.data.token;
  });

  await test("POST /api/register with duplicate email returns 422", async () => {
    const res = await request("/register", {
      method: "POST",
      body: JSON.stringify({ email: testEmail, password: testPassword, name: testName }),
    });
    assertEqual(res.status, 422, "status");
  });

  await test("POST /api/register with short password returns 422", async () => {
    const res = await request("/register", {
      method: "POST",
      body: JSON.stringify({ email: "x@x.com", password: "ab", name: "X" }),
    });
    assertEqual(res.status, 422, "status");
  });

  // --- Auth: login ---
  console.log("\nAuth - Login");
  await test("POST /api/login with valid credentials returns token", async () => {
    const res = await request("/login", {
      method: "POST",
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    assertEqual(res.status, 200, "status");
    const json = await res.json();
    assert(typeof json.data.token === "string", "should return a token");
    // This is a different token than registration
    testToken = json.data.token;
  });

  await test("POST /api/login with wrong password returns 401", async () => {
    const res = await request("/login", {
      method: "POST",
      body: JSON.stringify({ email: testEmail, password: "wrongpassword" }),
    });
    assertEqual(res.status, 401, "status");
  });

  await test("POST /api/login with non-existent user returns 401", async () => {
    const res = await request("/login", {
      method: "POST",
      body: JSON.stringify({ email: "nobody@example.com", password: "whatever" }),
    });
    assertEqual(res.status, 401, "status");
  });

  // --- Auth: session (Redis) ---
  console.log("\nAuth - Session (Redis-backed)");
  await test("GET /api/me with valid token returns user", async () => {
    const res = await request("/me", { headers: authHeader(testToken!) });
    assertEqual(res.status, 200, "status");
    const json = await res.json();
    assertEqual(json.data.email, testEmail, "email");
    assertEqual(json.data.name, testName, "name");
  });

  await test("GET /api/me with invalid token returns 401", async () => {
    const res = await request("/me", { headers: authHeader("bogus-token") });
    assertEqual(res.status, 401, "status");
  });

  // --- Contacts CRUD (authenticated) ---
  console.log("\nContacts CRUD (authenticated)");
  await test("GET /api/contacts returns a list", async () => {
    const res = await request("/contacts", { headers: authHeader(testToken!) });
    assertEqual(res.status, 200, "status");
    const json = await res.json();
    assert(Array.isArray(json.data), "data should be an array");
  });

  await test("POST /api/contacts creates a contact", async () => {
    const res = await request("/contacts", {
      method: "POST",
      headers: authHeader(testToken!),
      body: JSON.stringify({
        contact: {
          name: "Auth Test User",
          email: `authtest-${Date.now()}@example.com`,
          company: "Test Co",
          phone: "555-9999",
        },
      }),
    });
    assertEqual(res.status, 201, "status");
    const json = await res.json();
    assert(json.data.id > 0, "should have an id");
    assertEqual(json.data.name, "Auth Test User", "name");
    createdContactIds.push(json.data.id);
  });

  await test("POST /api/contacts validates required fields", async () => {
    const res = await request("/contacts", {
      method: "POST",
      headers: authHeader(testToken!),
      body: JSON.stringify({ contact: { company: "No Name Co" } }),
    });
    assertEqual(res.status, 422, "status");
    const json = await res.json();
    assert(json.errors.name !== undefined, "should have name error");
    assert(json.errors.email !== undefined, "should have email error");
  });

  await test("GET /api/contacts/:id returns a single contact", async () => {
    const id = createdContactIds[0];
    const res = await request(`/contacts/${id}`, { headers: authHeader(testToken!) });
    assertEqual(res.status, 200, "status");
    const json = await res.json();
    assertEqual(json.data.id, id, "id");
  });

  await test("PUT /api/contacts/:id updates a contact", async () => {
    const id = createdContactIds[0];
    const res = await request(`/contacts/${id}`, {
      method: "PUT",
      headers: authHeader(testToken!),
      body: JSON.stringify({ contact: { name: "Updated Auth User", status: "lead" } }),
    });
    assertEqual(res.status, 200, "status");
    const json = await res.json();
    assertEqual(json.data.name, "Updated Auth User", "name");
    assertEqual(json.data.status, "lead", "status");
  });

  await test("GET /api/contacts?q=Updated searches contacts", async () => {
    const res = await request("/contacts?q=Updated", { headers: authHeader(testToken!) });
    assertEqual(res.status, 200, "status");
    const json = await res.json();
    assert(json.data.length > 0, "should find results");
    assert(
      json.data.some((c: Contact) => c.name === "Updated Auth User"),
      "should include updated contact"
    );
  });

  await test("GET /api/contacts/:id returns 404 for missing", async () => {
    const res = await request("/contacts/999999", { headers: authHeader(testToken!) });
    assertEqual(res.status, 404, "status");
  });

  await test("DELETE /api/contacts/:id removes a contact", async () => {
    const id = createdContactIds.pop()!;
    const res = await request(`/contacts/${id}`, {
      method: "DELETE",
      headers: authHeader(testToken!),
    });
    assertEqual(res.status, 204, "status");

    const getRes = await request(`/contacts/${id}`, { headers: authHeader(testToken!) });
    assertEqual(getRes.status, 404, "should be gone");
  });

  // --- Logout (Redis session deletion) ---
  console.log("\nAuth - Logout (Redis session deletion)");
  await test("POST /api/logout invalidates the session token in Redis", async () => {
    // First, login to get a fresh token
    const loginRes = await request("/login", {
      method: "POST",
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const loginJson = await loginRes.json();
    const logoutToken = loginJson.data.token;

    // Verify it works
    const meRes1 = await request("/me", { headers: authHeader(logoutToken) });
    assertEqual(meRes1.status, 200, "token should work before logout");

    // Logout
    const logoutRes = await request("/logout", {
      method: "POST",
      headers: authHeader(logoutToken),
    });
    assertEqual(logoutRes.status, 200, "logout status");

    // Verify token no longer works (session deleted from Redis)
    const meRes2 = await request("/me", { headers: authHeader(logoutToken) });
    assertEqual(meRes2.status, 401, "token should be invalid after logout");
  });

  await test("Multiple sessions: logging in twice gives independent tokens", async () => {
    const res1 = await request("/login", {
      method: "POST",
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const json1 = await res1.json();
    const token1 = json1.data.token;

    const res2 = await request("/login", {
      method: "POST",
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const json2 = await res2.json();
    const token2 = json2.data.token;

    assert(token1 !== token2, "tokens should be different");

    // Both should work
    const me1 = await request("/me", { headers: authHeader(token1) });
    assertEqual(me1.status, 200, "token1 works");
    const me2 = await request("/me", { headers: authHeader(token2) });
    assertEqual(me2.status, 200, "token2 works");

    // Logout one, other should still work
    await request("/logout", { method: "POST", headers: authHeader(token1) });
    const me1After = await request("/me", { headers: authHeader(token1) });
    assertEqual(me1After.status, 401, "token1 invalid after logout");
    const me2After = await request("/me", { headers: authHeader(token2) });
    assertEqual(me2After.status, 200, "token2 still valid");

    // Cleanup
    await request("/logout", { method: "POST", headers: authHeader(token2) });
  });

  await cleanup();
  console.log(`\nDone. ${passed} passed, ${failed} failed.\n`);
}

run();
