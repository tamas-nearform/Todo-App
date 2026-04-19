'use client';

import { useState } from 'react';
import type { Todo } from '@/lib/todos';

interface Props {
  todo: Todo;
  onToggle: (id: number, completed: boolean) => Promise<void>;
  onEdit: (id: number, title: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function TodoItem({ todo, onToggle, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);

  async function save() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === todo.title) {
      setEditing(false);
      setDraft(todo.title);
      return;
    }
    await onEdit(todo.id, trimmed);
    setEditing(false);
  }

  return (
    <li className="item">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={(e) => onToggle(todo.id, e.target.checked)}
        aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
      />
      {editing ? (
        <input
          className="item-edit"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') { setEditing(false); setDraft(todo.title); }
          }}
          autoFocus
          aria-label={`Edit todo "${todo.title}"`}
          maxLength={200}
        />
      ) : (
        <span className={`item-title${todo.completed ? ' done' : ''}`}>{todo.title}</span>
      )}
      {!editing && (
        <button className="btn btn-ghost" type="button" onClick={() => setEditing(true)} aria-label={`Edit "${todo.title}"`}>
          Edit
        </button>
      )}
      <button className="btn btn-danger" type="button" onClick={() => onDelete(todo.id)} aria-label={`Delete "${todo.title}"`}>
        Delete
      </button>
    </li>
  );
}
