'use client';

import { useState } from 'react';
import type { Todo } from '@/lib/todos';
import TodoForm from './TodoForm';
import TodoItem from './TodoItem';

interface Props {
  initialTodos: Todo[];
}

export default function TodoList({ initialTodos }: Props) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);

  async function addTodo(title: string) {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title })
    });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to add');
    const created: Todo = await res.json();
    setTodos((prev) => [created, ...prev]);
  }

  async function toggleTodo(id: number, completed: boolean) {
    const res = await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ completed })
    });
    if (!res.ok) return;
    const updated: Todo = await res.json();
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  async function editTodo(id: number, title: string) {
    const res = await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title })
    });
    if (!res.ok) return;
    const updated: Todo = await res.json();
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  async function deleteTodo(id: number) {
    const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) return;
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  const remaining = todos.filter((t) => !t.completed).length;

  return (
    <>
      <TodoForm onAdd={addTodo} />
      <p aria-live="polite" className="empty" data-testid="remaining-count">
        {todos.length === 0
          ? 'No todos yet. Add your first one above.'
          : `${remaining} of ${todos.length} remaining`}
      </p>
      <ul className="list" aria-label="Todo list">
        {todos.map((t) => (
          <TodoItem
            key={t.id}
            todo={t}
            onToggle={toggleTodo}
            onEdit={editTodo}
            onDelete={deleteTodo}
          />
        ))}
      </ul>
    </>
  );
}
