import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import TodoList from '../../src/components/TodoList';
import type { Todo } from '../../src/lib/todos';

const mkTodo = (id: number, overrides: Partial<Todo> = {}): Todo => ({
  id,
  title: `Todo ${id}`,
  completed: false,
  created_at: '2026-01-01',
  ...overrides
});

function mockFetchOnce(body: unknown, init: { status?: number } = {}) {
  return vi.fn().mockResolvedValueOnce({
    ok: (init.status ?? 200) < 400,
    status: init.status ?? 200,
    json: async () => body
  });
}

describe('TodoList', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders empty state', () => {
    render(<TodoList initialTodos={[]} />);
    expect(screen.getByText(/no todos yet/i)).toBeInTheDocument();
  });

  it('renders count when todos exist', () => {
    render(<TodoList initialTodos={[mkTodo(1), mkTodo(2, { completed: true })]} />);
    expect(screen.getByTestId('remaining-count')).toHaveTextContent('1 of 2 remaining');
  });

  it('adds a todo via POST and prepends it', async () => {
    const created = mkTodo(3, { title: 'new' });
    vi.stubGlobal('fetch', mockFetchOnce(created, { status: 201 }));
    render(<TodoList initialTodos={[]} />);

    fireEvent.change(screen.getByLabelText(/new todo/i), { target: { value: 'new' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(screen.getByText('new')).toBeInTheDocument());
  });

  it('surfaces error when add fails', async () => {
    vi.stubGlobal('fetch', mockFetchOnce({ error: 'Title is required' }, { status: 400 }));
    render(<TodoList initialTodos={[]} />);

    fireEvent.change(screen.getByLabelText(/new todo/i), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/title is required/i);
  });

  it('toggles a todo via PATCH', async () => {
    const updated = mkTodo(1, { completed: true });
    vi.stubGlobal('fetch', mockFetchOnce(updated));
    render(<TodoList initialTodos={[mkTodo(1)]} />);

    fireEvent.click(screen.getByRole('checkbox'));
    await waitFor(() => expect(screen.getByTestId('remaining-count')).toHaveTextContent('0 of 1'));
  });

  it('deletes a todo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) }));
    render(<TodoList initialTodos={[mkTodo(1, { title: 'bye' })]} />);

    fireEvent.click(screen.getByRole('button', { name: /Delete/ }));
    await waitFor(() => expect(screen.queryByText('bye')).not.toBeInTheDocument());
  });
});
