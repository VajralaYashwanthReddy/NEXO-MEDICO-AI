type EventListener = (data: any) => void;

class EventBroadcaster {
  private listeners: Set<EventListener> = new Set();

  public subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public broadcast(event: string, payload: any, hospitalId?: string) {
    const data = JSON.stringify({ event, payload, hospitalId, timestamp: new Date().toISOString() });
    for (const listener of this.listeners) {
      try {
        listener(data);
      } catch (err) {
        console.error('SSE Broadcast error:', err);
      }
    }
  }
}

export const eventBroadcaster = new EventBroadcaster();
