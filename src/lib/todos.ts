import { getDb } from './db';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
}

interface TodoRow {
  id: number;
  title: string;
  completed: number;
  created_at: string;
}

const toTodo = (row: TodoRow): Todo => ({
  id: row.id,
  title: row.title,
  completed: row.completed === 1,
  created_at: row.created_at
});

export function listTodos(): Todo[] {
  const rows = getDb().prepare('SELECT id, title, completed, created_at FROM todos ORDER BY id DESC').all() as TodoRow[];
  return rows.map(toTodo);
}

export function getTodo(id: number): Todo | null {
  const row = getDb().prepare('SELECT id, title, completed, created_at FROM todos WHERE id = ?').get(id) as TodoRow | undefined;
  return row ? toTodo(row) : null;
}

export function createTodo(title: string): Todo {
  const trimmed = title.trim();
  if (!trimmed) throw new Error('Title is required');
  if (trimmed.length > 200) throw new Error('Title must be 200 characters or fewer');
  const info = getDb().prepare('INSERT INTO todos (title) VALUES (?)').run(trimmed);
  return getTodo(Number(info.lastInsertRowid))!;
}

export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
}

export function updateTodo(id: number, input: UpdateTodoInput): Todo | null {
  const existing = getTodo(id);
  if (!existing) return null;

  const nextTitle = input.title !== undefined ? input.title.trim() : existing.title;
  if (!nextTitle) throw new Error('Title is required');
  if (nextTitle.length > 200) throw new Error('Title must be 200 characters or fewer');
  const nextCompleted = input.completed !== undefined ? (input.completed ? 1 : 0) : (existing.completed ? 1 : 0);

  getDb().prepare('UPDATE todos SET title = ?, completed = ? WHERE id = ?').run(nextTitle, nextCompleted, id);
  return getTodo(id);
}

export function deleteTodo(id: number): boolean {
  const info = getDb().prepare('DELETE FROM todos WHERE id = ?').run(id);
  return info.changes > 0;
}
