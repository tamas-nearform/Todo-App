import { listTodos } from '@/lib/todos';
import TodoList from '@/components/TodoList';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main>
      <h1>Todos</h1>
      <TodoList initialTodos={listTodos()} />
    </main>
  );
}
