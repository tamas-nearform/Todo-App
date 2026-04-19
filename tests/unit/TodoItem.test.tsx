import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import TodoItem from '../../src/components/TodoItem';
import type { Todo } from '../../src/lib/todos';

const todo: Todo = { id: 1, title: 'Buy milk', completed: false, created_at: '2026-01-01' };

describe('TodoItem', () => {
  it('renders title and calls onToggle when checked', async () => {
    const onToggle = vi.fn().mockResolvedValue(undefined);
    render(<TodoItem todo={todo} onToggle={onToggle} onEdit={vi.fn()} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole('checkbox'));
    await waitFor(() => expect(onToggle).toHaveBeenCalledWith(1, true));
  });

  it('calls onDelete when delete button clicked', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<TodoItem todo={todo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /Delete/ }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(1));
  });

  it('enters edit mode and saves on Enter', async () => {
    const onEdit = vi.fn().mockResolvedValue(undefined);
    render(<TodoItem todo={todo} onToggle={vi.fn()} onEdit={onEdit} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Edit/ }));
    const field = screen.getByLabelText(/Edit todo/) as HTMLInputElement;
    fireEvent.change(field, { target: { value: 'Buy bread' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    await waitFor(() => expect(onEdit).toHaveBeenCalledWith(1, 'Buy bread'));
  });

  it('cancels edit on Escape', () => {
    const onEdit = vi.fn();
    render(<TodoItem todo={todo} onToggle={vi.fn()} onEdit={onEdit} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Edit/ }));
    const field = screen.getByLabelText(/Edit todo/) as HTMLInputElement;
    fireEvent.change(field, { target: { value: 'nope' } });
    fireEvent.keyDown(field, { key: 'Escape' });
    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('skips save when title unchanged', () => {
    const onEdit = vi.fn();
    render(<TodoItem todo={todo} onToggle={vi.fn()} onEdit={onEdit} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Edit/ }));
    const field = screen.getByLabelText(/Edit todo/) as HTMLInputElement;
    fireEvent.blur(field);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('shows line-through style when completed', () => {
    render(<TodoItem todo={{ ...todo, completed: true }} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Buy milk')).toHaveClass('done');
  });
});
