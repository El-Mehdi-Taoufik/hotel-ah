// Simple event emitter for cross-component communication
type EventCallback = () => void;

class EventEmitter {
  private listeners: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback());
    }
  }
}

export const eventEmitter = new EventEmitter();

// Event names
export const EVENTS = {
  RESERVATION_CREATED: 'reservation:created',
  RESERVATION_UPDATED: 'reservation:updated',
  RESERVATION_DELETED: 'reservation:deleted',
  RESERVATION_STATUS_CHANGED: 'reservation:status-changed',
  ROOM_CREATED: 'room:created',
  ROOM_UPDATED: 'room:updated',
  ROOM_DELETED: 'room:deleted',
  ROOM_STATUS_CHANGED: 'room:status-changed',
  GUEST_CREATED: 'guest:created',
  GUEST_UPDATED: 'guest:updated',
  GUEST_DELETED: 'guest:deleted',
  HOUSEKEEPING_UPDATED: 'housekeeping:updated',
  HOUSEKEEPING_COMPLETED: 'housekeeping:completed',
  PAYMENT_CREATED: 'payment:created',
  PAYMENT_RECEIVED: 'payment:received',
  PAYMENT_UPDATED: 'payment:updated',
  PAYMENT_DELETED: 'payment:deleted',
  DASHBOARD_REFRESH: 'dashboard:refresh',
};