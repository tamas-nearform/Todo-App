import { beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

function freshModule() {
  const dir = mkdtempSync(path.join(tmpdir(), 'todo-test-'));
  process.env.DATA_DIR = dir;
  process.env.DB_PATH = path.join(dir, `todos-${Date.now()}-${Math.random()}.db`);
}

describe('todos lib', () => {
  beforeEach(async () => {
    freshModule();
    const { resetDbForTests } = await import('../../src/lib/db');
    resetDbForTests();
  });

  it('creates and lists todos', async () => {
    const { createTodo, listTodos } = await import('../../src/lib/todos');
    const a = createTodo('Buy milk');
    const b = createTodo('Walk dog');
    expect(a.title).toBe('Buy milk');
    expect(a.completed).toBe(false);
    expect(a.id).toBeGreaterThan(0);
    const list = listTodos();
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe(b.id);
  });

  it('rejects empty titles', async () => {
    const { createTodo } = await import('../../src/lib/todos');
    expect(() => createTodo('   ')).toThrow(/required/i);
  });

  it('rejects overly long titles', async () => {
    const { createTodo } = await import('../../src/lib/todos');
    expect(() => createTodo('x'.repeat(201))).toThrow(/200 characters/);
  });

  it('updates title and completion', async () => {
    const { createTodo, updateTodo, getTodo } = await import('../../src/lib/todos');
    const t = createTodo('Old');
    const u = updateTodo(t.id, { title: 'New', completed: true });
    expect(u?.title).toBe('New');
    expect(u?.completed).toBe(true);
    expect(getTodo(t.id)?.completed).toBe(true);
  });

  it('update returns null for missing id', async () => {
    const { updateTodo } = await import('../../src/lib/todos');
    expect(updateTodo(9999, { completed: true })).toBeNull();
  });

  it('rejects empty title on update', async () => {
    const { createTodo, updateTodo } = await import('../../src/lib/todos');
    const t = createTodo('Hello');
    expect(() => updateTodo(t.id, { title: '   ' })).toThrow(/required/i);
  });

  it('deletes a todo', async () => {
    const { createTodo, deleteTodo, getTodo } = await import('../../src/lib/todos');
    const t = createTodo('Temp');
    expect(deleteTodo(t.id)).toBe(true);
    expect(getTodo(t.id)).toBeNull();
    expect(deleteTodo(t.id)).toBe(false);
  });

  it('getTodo returns null for missing id', async () => {
    const { getTodo } = await import('../../src/lib/todos');
    expect(getTodo(12345)).toBeNull();
  });
});
