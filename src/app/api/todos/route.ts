import { NextRequest, NextResponse } from 'next/server';
import { createTodo, listTodos } from '@/lib/todos';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(listTodos());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (typeof body?.title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    const todo = createTodo(body.title);
    return NextResponse.json(todo, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
