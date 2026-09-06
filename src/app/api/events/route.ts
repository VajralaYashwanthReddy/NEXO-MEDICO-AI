import { NextRequest } from 'next/server';
import { eventBroadcaster } from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const listener = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      const unsubscribe = eventBroadcaster.subscribe(listener);

      // Send initial connection heartbeat
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: 'CONNECTED', message: 'SSE Connection Established' })}\n\n`));

      req.signal.addEventListener('abort', () => {
        unsubscribe();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }
  });
}
