import { beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

function freshEnv() {
  const dir = mkdtempSync(path.join(tmpdir(), 'todo-api-'));
  process.env.DATA_DIR = dir;
  process.env.DB_PATH = path.join(dir, `api-${Date.now()}-${Math.random()}.db`);
}

const jsonReq = (method: string, body?: unknown) =>
  new Request('http://localhost/api/todos', {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  }) as never;

describe('POST /api/todos', () => {
  beforeEach(async () => {
    freshEnv();
    const { resetDbForTests } = await import('../../src/lib/db');
    resetDbForTests();
  });

  it('creates a todo', async () => {
    const { POST } = await import('../../src/app/api/todos/route');
    const res = await POST(jsonReq('POST', { title: 'First' }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.title).toBe('First');
    expect(body.completed).toBe(false);
  });

  it('rejects non-string title', async () => {
    const { POST } = await import('../../src/app/api/todos/route');
    const res = await POST(jsonReq('POST', { title: 123 }));
    expect(res.status).toBe(400);
  });

  it('rejects empty title with validation error', async () => {
    const { POST } = await import('../../src/app/api/todos/route');
    const res = await POST(jsonReq('POST', { title: '   ' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/required/i);
  });

  it('returns 400 on invalid JSON body', async () => {
    const { POST } = await import('../../src/app/api/todos/route');
    const req = new Request('http://localhost/api/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{ not json'
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/todos', () => {
  beforeEach(async () => {
    freshEnv();
    const { resetDbForTests } = await import('../../src/lib/db');
    resetDbForTests();
  });

  it('returns the list', async () => {
    const { GET, POST } = await import('../../src/app/api/todos/route');
    await POST(jsonReq('POST', { title: 'A' }));
    await POST(jsonReq('POST', { title: 'B' }));
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].title).toBe('B');
  });
});

describe('GET/PATCH/DELETE /api/todos/[id]', () => {
  beforeEach(async () => {
    freshEnv();
    const { resetDbForTests } = await import('../../src/lib/db');
    resetDbForTests();
  });

  it('GET returns the todo by id', async () => {
    const { createTodo } = await import('../../src/lib/todos');
    const { GET } = await import('../../src/app/api/todos/[id]/route');
    const t = createTodo('X');
    const res = await GET({} as never, { params: { id: String(t.id) } });
    expect(res.status).toBe(200);
    expect((await res.json()).id).toBe(t.id);
  });

  it('GET returns 400 on invalid id', async () => {
    const { GET } = await import('../../src/app/api/todos/[id]/route');
    const res = await GET({} as never, { params: { id: 'abc' } });
    expect(res.status).toBe(400);
  });

  it('GET returns 404 when not found', async () => {
    const { GET } = await import('../../src/app/api/todos/[id]/route');
    const res = await GET({} as never, { params: { id: '999' } });
    expect(res.status).toBe(404);
  });

  it('PATCH updates completed', async () => {
    const { createTodo } = await import('../../src/lib/todos');
    const { PATCH } = await import('../../src/app/api/todos/[id]/route');
    const t = createTodo('Y');
    const res = await PATCH(jsonReq('PATCH', { completed: true }), { params: { id: String(t.id) } });
    expect(res.status).toBe(200);
    expect((await res.json()).completed).toBe(true);
  });

  it('PATCH returns 404 when not found', async () => {
    const { PATCH } = await import('../../src/app/api/todos/[id]/route');
    const res = await PATCH(jsonReq('PATCH', { completed: true }), { params: { id: '999' } });
    expect(res.status).toBe(404);
  });

  it('PATCH returns 400 on invalid id', async () => {
    const { PATCH } = await import('../../src/app/api/todos/[id]/route');
    const res = await PATCH(jsonReq('PATCH', { completed: true }), { params: { id: 'abc' } });
    expect(res.status).toBe(400);
  });

  it('PATCH returns 400 on validation error', async () => {
    const { createTodo } = await import('../../src/lib/todos');
    const { PATCH } = await import('../../src/app/api/todos/[id]/route');
    const t = createTodo('Z');
    const res = await PATCH(jsonReq('PATCH', { title: '   ' }), { params: { id: String(t.id) } });
    expect(res.status).toBe(400);
  });

  it('DELETE removes the todo', async () => {
    const { createTodo, getTodo } = await import('../../src/lib/todos');
    const { DELETE } = await import('../../src/app/api/todos/[id]/route');
    const t = createTodo('W');
    const res = await DELETE({} as never, { params: { id: String(t.id) } });
    expect(res.status).toBe(204);
    expect(getTodo(t.id)).toBeNull();
  });

  it('DELETE returns 404 when missing', async () => {
    const { DELETE } = await import('../../src/app/api/todos/[id]/route');
    const res = await DELETE({} as never, { params: { id: '999' } });
    expect(res.status).toBe(404);
  });

  it('DELETE returns 400 on invalid id', async () => {
    const { DELETE } = await import('../../src/app/api/todos/[id]/route');
    const res = await DELETE({} as never, { params: { id: 'x' } });
    expect(res.status).toBe(400);
  });
});
