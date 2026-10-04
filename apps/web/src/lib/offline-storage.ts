// Offline persistence & sync queue manager
export interface QueuedSyncEvent {
  eventId: string;
  deviceId: string;
  entityType: 'Evidence' | 'CriterionAssessment';
  entityId: string;
  operation: 'CREATE' | 'UPDATE';
  baseVersion: number;
  clientSequence: number;
  payload: any;
  createdAt: string;
}

const STORAGE_KEY = 'sih26242_offline_sync_queue';
const CACHE_ASSESSMENT_KEY = 'sih26242_cached_assessment_';

export const OfflineStorage = {
  getQueue(): QueuedSyncEvent[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  enqueue(event: QueuedSyncEvent) {
    if (typeof window === 'undefined') return;
    const queue = this.getQueue();
    queue.push(event);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  },

  clearQueue() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  },

  cacheAssessment(id: string, data: any) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${CACHE_ASSESSMENT_KEY}${id}`, JSON.stringify(data));
    } catch {}
  },

  getCachedAssessment(id: string) {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(`${CACHE_ASSESSMENT_KEY}${id}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  isOfflineSimulated(): boolean {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('sih26242_simulated_offline') === 'true';
  },

  setOfflineSimulated(simulated: boolean) {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('sih26242_simulated_offline', simulated ? 'true' : 'false');
  }
};
