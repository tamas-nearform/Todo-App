# Todo App

A minimal todo app for the AINE Spec-Driven Development program (Phase 1–2).

## Stack

- Next.js 14 (App Router), React 18, TypeScript
- SQLite via `better-sqlite3`
- Vitest + Testing Library for unit tests
- Playwright for E2E
- Docker / docker-compose

## Features

- Create, list, edit, toggle, and delete todos
- Persistence across refreshes and restarts

Out of scope: accounts, collaboration, priorities, deadlines, notifications.

## Running locally

```bash
npm install
npm run dev
```

App runs on http://localhost:3000.

## Tests

```bash
npm test              # unit tests + coverage
npx playwright install
npm run test:e2e      # end-to-end tests
```

Vitest enforces a 70% coverage threshold for lines, branches, functions, and statements.

## Docker

```bash
docker compose up --build
```

SQLite data is stored in the `todo-data` volume.

## Layout

```
src/
  app/         routes, API handlers, styles
  components/  TodoForm, TodoItem, TodoList
  lib/         db.ts, todos.ts
tests/
  unit/        Vitest
  e2e/         Playwright
```
