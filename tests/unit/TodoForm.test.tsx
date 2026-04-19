import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import TodoForm from '../../src/components/TodoForm';

describe('TodoForm', () => {
  it('submits trimmed input and clears the field', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<TodoForm onAdd={onAdd} />);

    const input = screen.getByLabelText(/new todo/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '  Learn SDD  ' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => expect(onAdd).toHaveBeenCalledWith('Learn SDD'));
    await waitFor(() => expect(input.value).toBe(''));
  });

  it('shows validation error for empty input', async () => {
    const onAdd = vi.fn();
    render(<TodoForm onAdd={onAdd} />);

    const input = screen.getByLabelText(/new todo/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form')!);

    expect(await screen.findByRole('alert')).toHaveTextContent(/enter a todo/i);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('surfaces errors from onAdd', async () => {
    const onAdd = vi.fn().mockRejectedValue(new Error('boom'));
    render(<TodoForm onAdd={onAdd} />);

    const input = screen.getByLabelText(/new todo/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'thing' } });
    fireEvent.submit(input.closest('form')!);

    expect(await screen.findByRole('alert')).toHaveTextContent(/boom/);
  });
});
