# CRM Demo — Coasts Example Project

A simple CRM app used to demonstrate [Coasts](https://github.com/coast-guard/coasts), a Docker-in-Docker isolated dev environment tool. The app has an Elixir/Phoenix API backend, a Next.js frontend, Postgres for storage, and Redis for session management.

## Project Structure

```
coasts-demo/
  backend/          Elixir/Phoenix API (containerized via Docker)
  frontend/         Next.js app (runs as a bare process, not containerized)
  test/             Integration tests (TypeScript, runs with tsx)
  docker-compose.yml
  Coastfile
```

## Running Locally (without Coasts)

```bash
docker compose up -d          # starts backend, postgres, redis
cd frontend && npm install && npm run dev   # starts Next.js on :3000
```

The frontend proxies `/api/*` requests to `localhost:4000` via Next.js rewrites.

## Running with Coasts

```bash
coast build
coast run dev-1
coast checkout dev-1
```

Open `localhost:3000` (frontend) or `localhost:4000/api/health` (backend).

## Network Topology

### Local Docker Compose

Straightforward — all services share one Docker bridge network:

```
Host machine
├── docker compose
│   ├── backend        :4000  (Phoenix API)
│   ├── postgres       :5432
│   └── redis          :6379
└── frontend           :3000  (bare process, Next.js dev server)
    └── proxies /api/* → localhost:4000
```

### Coasts (Docker-in-Docker)

Coasts runs the project inside a DinD container. The topology has three layers:

```
┌─── Host (macOS) ─────────────────────────────────────────────────┐
│                                                                   │
│  coast-dev daemon                                                 │
│    ├── socat forwarders (canonical ports)                         │
│    │     localhost:3000 ──→ DinD:3000                             │
│    │     localhost:4000 ──→ DinD:4000                             │
│    │                                                              │
│  Host Docker daemon                                               │
│    ├── coast-shared: postgres  (:5432, on coast-shared-crm-demo)  │
│    ├── coast-shared: redis     (:6379, on coast-shared-crm-demo)  │
│    │                                                              │
│  ┌─── DinD Container (crm-demo-coasts-dev-1) ────────────────┐   │
│  │                                                             │   │
│  │  Connected to: coast-shared-crm-demo network               │   │
│  │  (can reach shared postgres/redis by hostname)              │   │
│  │                                                             │   │
│  │  Inner Docker daemon                                        │   │
│  │    └── backend container  :4000                             │   │
│  │          ├── DATABASE_URL → postgres:5432                   │   │
│  │          ├── REDIS_URL   → redis:6379                       │   │
│  │          └── extra_hosts: postgres → bridge gateway IP      │   │
│  │                           redis   → bridge gateway IP       │   │
│  │                                                             │   │
│  │  /coast-supervisor/ (bare services)                         │   │
│  │    └── web (Next.js dev server)  :3000                      │   │
│  │                                                             │   │
│  │  /workspace ← bind mount of project root                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

Key details:

- **Shared services** (postgres, redis) run on the host Docker daemon, not inside DinD. They are shared across Coast instances and persist data between `coast rm` cycles. Coast automatically strips them from the inner compose file and injects `extra_hosts` entries so the backend container can reach them by hostname.

- **Compose services** (backend) run inside the inner Docker daemon within the DinD container. Coast builds the image on the host, loads it into the inner daemon, and starts it with a rewritten compose file that removes shared services and their `depends_on` references.

- **Bare services** (frontend/web) run as plain processes directly on the DinD host OS, managed by `/coast-supervisor/`. They are defined in `[services.*]` in the Coastfile and are not containerized. They have fast filesystem access to `/workspace`.

- **Port forwarding** uses `socat` on the host. `coast checkout dev-1` binds canonical ports (3000, 4000, etc.) to the checked-out instance. Dynamic ports in the 49152-65535 range are always available for any running instance regardless of checkout state.

- **Hot assign** (`[assign.services] backend = "hot"`) means branch switches swap the `/workspace` bind mount without restarting containers. The backend picks up code changes via the mounted volume. Rebuild triggers (`mix.exs`, `mix.lock`, `Dockerfile`) force a full image rebuild when those files change.

## Integration Tests

```bash
# With backend running (locally or via Coast):
cd test && npx tsx integration.test.ts
```

Tests cover health checks, auth (register/login/logout), Redis-backed sessions, and contacts CRUD.
