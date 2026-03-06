# CRM Demo — Coast Skills

## What is Coast

Coast runs isolated development environments using Docker-in-Docker containers.
Each Coast instance is a self-contained replica of the project's runtime — services,
databases, ports — running inside a DinD container on the host. Multiple instances
can run simultaneously for different branches without conflicting.

The host filesystem is shared with the Coast container. File edits you make on the
host are instantly visible inside the running services. You never need to copy files
or rebuild after editing source code (unless build dependencies change).

All runtime operations — running tests, checking logs, accessing databases — happen
inside the Coast via `coast exec`. Do not run services directly on the host.

## Orientation

Before any runtime command, discover which Coast instance matches your working directory:

```
coast lookup
```

This prints instance names, ports, URLs, and example commands. Use the instance
name from the output for all subsequent commands. Use `--json` for structured output.

If `coast lookup` returns no instances, the Coast is not running. Start one:

```
coast build
coast run dev-1
coast checkout dev-1
```

## CLI Documentation

Coast has built-in docs accessible from the CLI. Browse the full docs tree:

```
coast docs
```

Read a specific doc:

```
coast docs --path concepts_and_terminology/LOOKUP.md
coast docs --path concepts_and_terminology/FILESYSTEM.md
coast docs --path concepts_and_terminology/EXEC_AND_DOCKER.md
coast docs --path concepts_and_terminology/LOGS.md
coast docs --path coastfiles/VOLUMES.md
coast docs --path coastfiles/SHARED_SERVICES.md
```

Search the docs with natural language (semantic search):

```
coast search-docs "how do shared services work"
coast search-docs "port forwarding not working"
coast search-docs "volume strategies isolated vs shared"
```

Use `coast docs` and `coast search-docs` whenever you encounter unfamiliar behavior
or need to understand a Coast concept. The docs cover the full Coastfile schema,
volume strategies, assign behavior, port forwarding, troubleshooting, and more.

## Project Architecture

- **backend** — Elixir/Phoenix API on port 4000 (Docker Compose service inside DinD)
- **web** — Next.js frontend on port 3000 (bare process on DinD host)
- **postgres** — PostgreSQL 15 (shared service on host Docker daemon)
- **redis** — Redis 7 (shared service on host Docker daemon)

The frontend proxies `/api/*` to the backend. Postgres and Redis are shared across
Coast instances by default and persist data between `coast rm` cycles.

## Development Workflow

Day-to-day development uses Coast as the runtime. The default `Coastfile` starts all
services automatically — backend, frontend, postgres, and redis:

```
coast build
coast run dev-1
coast checkout dev-1
```

After checkout, the frontend is at `localhost:3000` and the backend API at
`localhost:4000`. Edit files on the host and the running services pick up changes
immediately (the backend uses hot assign — branch switches swap the workspace mount
without restarting containers).

Rebuilds are only triggered when `backend/Dockerfile`, `backend/mix.exs`, or
`backend/mix.lock` change.

## Integration Testing Workflow

For integration tests, this project also has a `Coastfile.test` variant that creates
fully isolated instances — each with its own postgres and redis running inside DinD
(no shared services), and no frontend. Services do not auto-start.

```
coast build --type test
coast run test-1 --type test
coast exec test-1 -- docker compose up -d
coast exec test-1 -- sh -c "cd test && npx tsx integration.test.ts"
```

Test instances get isolated database volumes that are cleaned up on `coast rm`.
This means tests always run against a fresh database with no shared state between
instances.

## Running Commands

Use `coast exec` to run commands inside the Coast. The shell starts at `/workspace`
(the project root). `cd` to your target directory first:

```
coast exec <instance> -- sh -c "cd <dir> && <command>"
```

### Common Tasks

Run integration tests (backend must be running):

```
coast exec <instance> -- sh -c "cd test && npx tsx integration.test.ts"
```

Run backend tests:

```
coast exec <instance> -- sh -c "cd backend && mix test"
```

Access the Elixir console:

```
coast exec <instance> -- docker compose exec backend sh -c "cd /app && mix remote"
```

Run database migrations:

```
coast exec <instance> -- docker compose exec backend sh -c "cd /app && mix ecto.migrate"
```

Reset the database:

```
coast exec <instance> -- docker compose exec backend sh -c "cd /app && mix ecto.reset"
```

Install frontend dependencies:

```
coast exec <instance> -- sh -c "cd frontend && npm install"
```

## Runtime Feedback

Check service status:

```
coast ps <instance>
```

Read service logs:

```
coast logs <instance> --service backend
coast logs <instance> --service web
coast logs <instance> --service backend --tail 50
```

## Troubleshooting

Run diagnostics to detect and fix orphaned state or stale port bindings:

```
coast doctor --dry-run
coast doctor
```

## Rules

- Always run `coast lookup` before your first runtime command in a session.
- Do not run services directly on the host. Use `coast exec` for all runtime tasks.
- File edits on the host are instantly visible inside the Coast.
- Use `coast docs` and `coast search-docs` to look up Coast concepts and troubleshoot.
- For test instances (`--type test`), services do not auto-start. Run
  `coast exec <instance> -- docker compose up -d` to start them.
- Check whether you are working inside a git worktree (look for `.worktrees/` in
  your path). If you are on the main branch or project root and not in a worktree,
  confirm with the user before making changes — your edits affect every Coast
  instance that shares the main branch workspace.
