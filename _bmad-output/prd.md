# Todo App - PRD

Phase 1-2 of the AINE SDD program. Owner: Tamás Kovács.

## What I built

A small single-user todo list. You type things in, check them off, edit them, delete them. Data sticks around between refreshes and restarts. That's it.

I kept the scope tight on purpose. No accounts, no sharing, no priorities, no due dates, no notifications. Those might come later but not in this phase.

The real point of this project for me was to walk through the whole spec-driven flow (PRD, architecture, code, tests, deploy) on something small enough to finish but real enough to be useful.

## Who uses it

One person, on their own machine, during a work session. They open the app, dump whatever is on their mind into the list, tick things off as they go, fix typos, delete stuff that no longer matters, and expect the list to still be there tomorrow.

There's no onboarding and no help screen. If the UI needs explaining, I got it wrong.

## User stories

1. Add a todo by typing a title and hitting enter or clicking the button.
2. See the existing list when I open the app.
3. Check off a todo when I'm done with it, and uncheck it if I need to.
4. Edit the title of a todo that's already in the list.
5. Delete a todo I don't want anymore.
6. Refresh the page (or restart the container) and still see my todos.
7. Do all of the above with just a keyboard.
8. See something useful when the list is empty instead of a blank page.
9. See how many todos are still open so I know where I'm at.

## What each story means in practice

**Adding.** One text field, one submit button. Title gets trimmed, empty titles are rejected with an inline error, anything over 200 chars is rejected too. New todo shows up at the top of the list. Button goes disabled while the request is in flight so you can't double-submit.

**Listing.** Server renders the list on page load, newest first. There's a small line above the list that says "X of Y remaining" when there are todos, or "No todos yet. Add your first one above." when there aren't. I made that line an aria-live region so screen readers pick up changes.

**Toggling.** Checkbox per row. Clicking it sends the update and flips the UI when the server confirms. Completed ones are styled differently (strikethrough, muted) but stay in the list.

**Editing.** There's an Edit button that swaps the title for an input. Enter or blur saves, Escape cancels. Same validation as adding: non-empty, trimmed, max 200. If you don't actually change anything, no request goes out.

**Deleting.** Delete button removes the row. I left out the confirmation dialog for now because the scope is small enough that the friction isn't worth it.

**Persistence.** SQLite file on disk. In Docker it lives on a named volume so `docker compose down && docker compose up --build` doesn't nuke your todos.

**Keyboard / a11y.** Every control is reachable with tab. Labels are either visible or attached via aria-label. Errors use role="alert" and are linked with aria-describedby. I was aiming for zero critical WCAG 2.1 AA issues on automated checks.

## Non-functional stuff

Nothing exotic. List render should feel instant with a couple hundred todos, which is easy since it's SQLite on localhost. Runs the same on Windows, Mac and Linux via Docker. No auth because I'm assuming it runs on localhost only. SQL goes through prepared statements. Unit coverage has to stay above 70% (Vitest enforces it), and I wanted at least 5 Playwright E2E tests covering the core flows.

## Done when

- All nine stories work end to end.
- `docker compose up --build` on a clean checkout gets you a working app on localhost:3000.
- Vitest passes with ≥70% coverage on lines, branches, functions, statements.
- At least 5 Playwright tests pass.
- No critical WCAG violations from the automated a11y check.
- README covers setup, tests, Docker, and the AI log.
- This PRD and the architecture doc are in the repo.

## Not in this phase

Accounts, auth, sharing, collaboration, priorities, tags, deadlines, reminders, search, filtering, bulk ops, offline/PWA, import/export, analytics, i18n. Some of these will probably come back in a future iteration but I'm not designing for them now.

## Assumptions

- Runs on localhost or a trusted LAN. No hardening for public internet.
- SQLite is fine for the kind of volume I expect (tens, maybe low hundreds of todos).
- Stack is fixed by the program: Next.js 14 App Router, React 18, TypeScript, Node 20.

## Open questions

None blocking Phase 1-2. Auth/sharing/notification design gets its own PRD when those come back into scope.
