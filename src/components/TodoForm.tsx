'use client';

import { useState, FormEvent } from 'react';

interface Props {
  onAdd: (title: string) => Promise<void>;
}

export default function TodoForm({ onAdd }: Props) {
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Please enter a todo title.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onAdd(trimmed);
      setTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add todo');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} aria-label="Add todo">
      <label htmlFor="new-todo" className="sr-only">New todo</label>
      <input
        id="new-todo"
        className="input"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        maxLength={200}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? 'form-error' : undefined}
      />
      <button className="btn" type="submit" disabled={submitting}>
        {submitting ? 'Adding…' : 'Add'}
      </button>
      {error && <p id="form-error" className="error" role="alert">{error}</p>}
    </form>
  );
}
