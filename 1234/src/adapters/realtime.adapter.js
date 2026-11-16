class RealtimeAdapter {
  constructor() {
    this.clients = new Map(); // userId -> Set<res>
    this.recentEvents = [];
  }

  subscribe(userId, res) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(res);
    res.on('close', () => {
      const set = this.clients.get(userId);
      if (set) {
        set.delete(res);
        if (set.size === 0) this.clients.delete(userId);
      }
    });
  }

  emitToUser(userId, eventType, payload) {
    const evt = {
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      user_id: userId,
      event_type: eventType,
      payload,
      timestamp: new Date().toISOString()
    };
    this.recentEvents.push(evt);
    if (this.recentEvents.length > 500) this.recentEvents.shift();

    const set = this.clients.get(userId);
    if (set) {
      const data = `event: ${eventType}\ndata: ${JSON.stringify(evt)}\n\n`;
      for (const res of set) {
        try {
          res.write(data);
        } catch (_) {}
      }
    }
    return evt;
  }

  getRecentEventsForUser(userId, sinceIso = null) {
    return this.recentEvents.filter(e => {
      if (e.user_id !== userId && e.user_id !== '*') return false;
      if (sinceIso && e.timestamp <= sinceIso) return false;
      return true;
    });
  }
}

export const realtimeHub = new RealtimeAdapter();
export { RealtimeAdapter };
export default { RealtimeAdapter, realtimeHub };
