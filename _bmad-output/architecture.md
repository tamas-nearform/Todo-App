# Todo App - Architecture

## How I set it up

It's one Next.js 14 process that serves the UI and also exposes the JSON API. The database is just a SQLite file sitting next to the app on disk. No queues, no cache, no background workers, no extra services. For a single-user local app that's overkill.

The browser talks HTTP to the Next.js process. The Next.js process talks to SQLite via `better-sqlite3` (synchronous, in-process). The SQLite file lives in a directory that's a mounted volume in Docker, so data survives container rebuilds.

## Stack

- Next.js 14 with the App Router, because that's what the program mandates and it gives me server components plus route handlers in one package.
- TypeScript 5 to catch shape mismatches on the server/client boundary.
- React 18 with plain CSS in `globals.css`. The UI is small enough that a component library would just add noise.
- `better-sqlite3` for persistence. One file, zero config, synchronous API, which keeps the domain code free of `await` noise.
- Vitest + Testing Library + jsdom for unit tests.
- Playwright for E2E.
- Docker + docker-compose so the whole thing comes up with one command.
- Node 20 on `bookworm-slim` because `better-sqlite3` needs a C toolchain at build time.

## Layout

```
src/
  app/
    layout.tsx        root HTML shell + metadata
    page.tsx          server component, loads todos and renders <TodoList>
    globals.css       styling
    api/todos/
      route.ts        GET and POST
      [id]/route.ts   PATCH and DELETE
  components/         client components
    TodoForm.tsx      add-todo form
    TodoItem.tsx      one row, checkbox + title + edit + delete
    TodoList.tsx      holds the list state and does the fetch calls
  lib/
    db.ts             lazy better-sqlite3 singleton
    todos.ts          create/list/update/delete with validation
tests/
  unit/               Vitest
  e2e/                Playwright
```

## Layers

I split things into three layers and tried to keep the direction of dependency one-way:

- `lib/db.ts` owns the SQLite connection and the `CREATE TABLE` bootstrap.
- `lib/todos.ts` is the domain layer. It's where the validation lives (title trimmed, non-empty, max 200 chars), and it's the only place that talks to `db.ts`.
- The `route.ts` files under `app/api` are thin. They parse the request, call into the domain, and shape the response. No business logic there.

Client components never import `lib/todos.ts` directly. If they did, the SQLite driver would end up in the browser bundle. They go through the JSON API instead.

## Server vs client rendering

`app/page.tsx` is a server component. It calls `listTodos()` against SQLite at render time and passes the array straight into `<TodoList>` as `initialTodos`. That saves one round-trip on first paint - the initial HTML already has the todos in it.

I marked the page with `export const dynamic = 'force-dynamic'` because otherwise Next.js might cache the render and show a stale list.

`TodoList`, `TodoForm`, and `TodoItem` are client components (`'use client'`). They manage local state and do the fetch calls for mutations.

## Data model

One table. I create it idempotently when the connection is first opened:

```sql
CREATE TABLE IF NOT EXISTS todos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT    NOT NULL,
  completed  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

The TypeScript side converts `completed` from 0/1 to boolean at the boundary so the rest of the code doesn't have to think about it. Lists come out `ORDER BY id DESC` so newest shows up first.

No migration framework. The schema is one table with four columns - a migration library would be all cost and no benefit at this point. If I need a breaking schema change later I'll either add a proper tool or write a one-off script.

## API

All JSON. Errors come back as `{ "error": "..." }`.

- `GET /api/todos` - list everything, newest first, 200.
- `POST /api/todos` - create, returns 201 with the new todo, 400 if the title is invalid.
- `PATCH /api/todos/:id` - update title and/or completion, 200 with the updated row, 400 for invalid input, 404 if the id doesn't exist.
- `DELETE /api/todos/:id` - 204 on success, 404 if it's gone already.

No pagination. At the data volumes I expect it isn't worth it.

## What happens on a request

**Initial page load:** browser hits `/`, Next.js runs `page.tsx`, which calls `listTodos()`, which opens the SQLite connection (or reuses the cached one) and returns the rows. The HTML streams to the browser with the todos already baked in. React hydrates the client components.

**Adding:** user submits the form in `TodoForm`. `TodoList.addTodo` posts to `/api/todos`. The route handler calls `createTodo(title)`. Domain trims, validates, inserts, returns the new row. The handler sends back 201. `TodoList` prepends the new todo to its local state and the UI updates.

**Toggling, editing, deleting** follow the same shape but with PATCH or DELETE. Local state gets updated from the server response (for PATCH) or by filtering out the deleted id (for DELETE). I don't refetch the list - I trust the server response as the source of truth for the row that changed.

## Running it

**Local dev:** `npm run dev`, Next.js starts on port 3000, SQLite file lands in `./data/todos.db`. The `data/` folder is gitignored.

**Docker:** the Dockerfile uses `node:20-bookworm-slim`, installs `python3 make g++` (needed to build `better-sqlite3`), copies the source, runs `npm run build`, and starts with `npm start`. Compose exposes port 3000 and mounts a named volume `todo-data` at `/app/data`. `DATA_DIR` is set to `/app/data` so writes go into the volume. That's what makes the data survive `docker compose down && docker compose up --build`.

Config surface is just two env vars: `DATA_DIR` (default `./data`) and `DB_PATH` (default `<DATA_DIR>/todos.db`, mostly used so unit tests can point at a tmp file).

## Testing

Unit tests (Vitest) live under `tests/unit/`. Domain functions get tested against a tmp SQLite file - each test sets `DB_PATH` and calls `resetDbForTests()` to drop the cached connection. Component tests use Testing Library + jsdom to cover form validation, Enter/Escape in edit mode, and the empty-list message. I set the coverage threshold to 70% on lines, branches, functions, and statements in `vitest.config.ts`.

E2E (Playwright) is under `tests/e2e/`. It boots the built server and drives Chromium. At least 5 scenarios cover the golden path: create, toggle, edit, delete, and refresh-persistence.

Accessibility checks (axe) run in the E2E suite and fail the build on critical violations.

## Decisions worth writing down

**SQLite and better-sqlite3, not an external DB.** The app is single-user and local. SQLite is one file, no network, no pool, and `better-sqlite3` is synchronous which keeps the domain layer simple. The trade-off is no horizontal scaling, but that's not in scope.

**Server component for the initial render, client components for mutations.** First paint has no loading state and no extra round-trip. Mutations stay interactive. The client bundle stays small because the domain code never crosses over.

**Validation in the domain layer, not in the route handlers.** Keeps the route handlers thin and makes validation testable without spinning up HTTP. If a second transport ever shows up (CLI, different API), validation is already in the right place.

**No migration framework.** Adding one now would be pure overhead for one table. I'd rather add it when I actually have a breaking schema change to do.

**No auth stubs.** The PRD scopes auth out. Adding speculative `user_id` columns or auth hooks now would just be noise. When auth comes back I'll add a `user_id` column and an auth hook in the route handlers - clean diff, no restructuring.

**`force-dynamic` on the home page.** Next.js will statically cache a server component if you let it. For this app that would show stale lists. The small perf cost of disabling static caching is fine on a local app.

## Risks I thought about

- `better-sqlite3` native build failing on the host. Dockerfile installs the C toolchain up front and the README points at Docker as the supported path.
- Data loss on container rebuild. Named volume mounted at `DATA_DIR`, checked as part of the Docker success criterion in the PRD.
- Regressions on the happy path. 70% coverage gate + 5 Playwright scenarios fail the build if the golden path breaks.
- Accessibility regressions. Axe runs in E2E.

## Where I'd extend it later

If the scope opens back up, these are the seams I left in on purpose:

- **Auth / multi-user.** Add `user_id` to `todos`, extract session in the route handlers, thread an owner into the domain calls.
- **New fields (priority, due date).** Add columns in `db.ts` additively, extend the `Todo` interface, pass the new fields through `createTodo`/`updateTodo`. UI changes stay in `TodoItem` and `TodoForm`.
- **Real-time.** Add a WebSocket or SSE route alongside the REST API. REST stays the authoritative write path.
- **Different database.** Swap `lib/db.ts`. Domain signatures don't change.
