import { NextRequest, NextResponse } from 'next/server';

interface Message {
  id: string;
  name: string;
  text: string;
  ts: number;
}

const messages: Message[] = [];
const MAX_MESSAGES = 200;

export async function GET() {
  return NextResponse.json(messages.slice(-100));
}

export async function POST(req: NextRequest) {
  try {
    const { name, text } = await req.json();
    if (!name || !text || typeof name !== 'string' || typeof text !== 'string') {
      return NextResponse.json({ error: 'Invalid' }, { status: 400 });
    }

    const msg: Message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.slice(0, 20),
      text: text.slice(0, 500),
      ts: Date.now(),
    };

    messages.push(msg);
    if (messages.length > MAX_MESSAGES) messages.splice(0, messages.length - MAX_MESSAGES);

    return NextResponse.json(msg);
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
