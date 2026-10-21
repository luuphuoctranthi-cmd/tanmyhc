import {
  Procedure,
  NewsArticle,
  WorkScheduleItem,
  CitizenFeedback,
  TransparencyItem,
  TrafficFloodReport,
  AdministrativeContact,
  PartyGovLeader,
  AppStatistics,
  Officer,
  DailyStatRecord
} from '../types';
import { DEFAULT_PROCEDURES } from '../data/defaultProcedures';
import {
  DEFAULT_NEWS,
  DEFAULT_SCHEDULE,
  DEFAULT_FEEDBACKS,
  DEFAULT_TRANSPARENCY_DOCS,
  DEFAULT_TRAFFIC_REPORTS,
  DEFAULT_CONTACTS,
  DEFAULT_PARTY_GOV_LEADERS
} from '../data/portalData';
import { DEFAULT_PORTAL_LAYOUT_CONFIG, CitizenPortalLayoutConfig } from '../data/portalNavSettings';
import { DEFAULT_STATS } from '../utils/statsStorage';
import { DEFAULT_OFFICERS } from '../utils/excelOfficerParser';
import { DEFAULT_DAILY_STATS } from '../data/dailyStatsData';

export interface SystemDatabaseState {
  procedures: Procedure[];
  news: NewsArticle[];
  schedules: WorkScheduleItem[];
  feedbacks: CitizenFeedback[];
  transparencyDocs: TransparencyItem[];
  trafficReports: TrafficFloodReport[];
  contacts: AdministrativeContact[];
  partyGovLeaders: PartyGovLeader[];
  layoutConfig: CitizenPortalLayoutConfig;
  stats: AppStatistics;
  officers: Officer[];
  dailyStats: DailyStatRecord[];
  lastUpdated: number;
}

const LOCAL_STORAGE_KEY = 'tanmy_full_system_database_v1';
const CHANNEL_NAME = 'tanmy_permanent_system_sync_channel';

// Initial default state
export function getInitialSystemDefaults(): SystemDatabaseState {
  return {
    procedures: DEFAULT_PROCEDURES,
    news: DEFAULT_NEWS,
    schedules: DEFAULT_SCHEDULE,
    feedbacks: DEFAULT_FEEDBACKS,
    transparencyDocs: DEFAULT_TRANSPARENCY_DOCS,
    trafficReports: DEFAULT_TRAFFIC_REPORTS,
    contacts: DEFAULT_CONTACTS,
    partyGovLeaders: DEFAULT_PARTY_GOV_LEADERS,
    layoutConfig: DEFAULT_PORTAL_LAYOUT_CONFIG,
    stats: DEFAULT_STATS,
    officers: DEFAULT_OFFICERS,
    dailyStats: DEFAULT_DAILY_STATS,
    lastUpdated: 1729480000000
  };
}

class SystemStorageManager {
  private currentState: SystemDatabaseState;
  private listeners: Set<(state: SystemDatabaseState) => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private syncInterval: any = null;
  private isSavingToServer = false;
  private lastSavedServerTime = 0;

  constructor() {
    this.currentState = this.loadFromLocalCache();

    // BroadcastChannel for 0ms cross-tab synchronization
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'SYSTEM_DATA_UPDATED' && event.data.payload) {
            const incomingState = event.data.payload as SystemDatabaseState;
            if (incomingState.lastUpdated > this.currentState.lastUpdated) {
              this.applyIncomingState(incomingState, false);
            }
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported or restricted:', err);
      }
    }

    // Initialize initial fetch from persistent server disk
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.fetchFromServer();
        this.startBackgroundSync();
      }, 100);
    }
  }

  // Load from LocalStorage for instant zero-lag rendering
  private loadFromLocalCache(): SystemDatabaseState {
    const defaults = getInitialSystemDefaults();
    if (typeof window === 'undefined') return defaults;

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaults));
        return defaults;
      }
      const parsed = JSON.parse(raw);
      return {
        ...defaults,
        ...parsed,
        procedures: Array.isArray(parsed.procedures) && parsed.procedures.length > 0 ? parsed.procedures : defaults.procedures,
        news: Array.isArray(parsed.news) && parsed.news.length > 0 ? parsed.news : defaults.news,
        schedules: Array.isArray(parsed.schedules) && parsed.schedules.length > 0 ? parsed.schedules : defaults.schedules,
        feedbacks: Array.isArray(parsed.feedbacks) && parsed.feedbacks.length > 0 ? parsed.feedbacks : defaults.feedbacks,
        transparencyDocs: Array.isArray(parsed.transparencyDocs) && parsed.transparencyDocs.length > 0 ? parsed.transparencyDocs : defaults.transparencyDocs,
        trafficReports: Array.isArray(parsed.trafficReports) && parsed.trafficReports.length > 0 ? parsed.trafficReports : defaults.trafficReports,
        contacts: Array.isArray(parsed.contacts) && parsed.contacts.length > 0 ? parsed.contacts : defaults.contacts,
        partyGovLeaders: Array.isArray(parsed.partyGovLeaders) && parsed.partyGovLeaders.length > 0 ? parsed.partyGovLeaders : defaults.partyGovLeaders,
        dailyStats: Array.isArray(parsed.dailyStats) && parsed.dailyStats.length > 0 ? parsed.dailyStats : defaults.dailyStats,
        lastUpdated: parsed.lastUpdated || Date.now()
      };
    } catch (e) {
      console.error('Error loading local system database:', e);
      return defaults;
    }
  }

  // Save to LocalStorage immediately
  private saveToLocalCache(state: SystemDatabaseState) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving local system database:', e);
    }
  }

  // Get current snapshot
  public getState(): SystemDatabaseState {
    return this.currentState;
  }

  // Subscribe to changes
  public subscribe(listener: (state: SystemDatabaseState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentState);
      } catch (err) {
        console.error('Error notifying system storage listener:', err);
      }
    });
  }

  // Update a single or multiple collections and persist permanently
  public updateCollections(partial: Partial<SystemDatabaseState>) {
    const updatedState: SystemDatabaseState = {
      ...this.currentState,
      ...partial,
      lastUpdated: Date.now()
    };

    this.applyIncomingState(updatedState, true);
    this.pushToServer(updatedState);
  }

  private applyIncomingState(state: SystemDatabaseState, shouldBroadcast: boolean) {
    this.currentState = state;
    this.saveToLocalCache(state);
    this.notifyListeners();

    if (shouldBroadcast && this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'SYSTEM_DATA_UPDATED',
          payload: state
        });
      } catch (err) {
        console.warn('Failed to broadcast system update:', err);
      }
    }
  }

  // Fetch from server API
  public async fetchFromServer(): Promise<boolean> {
    try {
      const response = await fetch('/api/system/data', {
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) return false;

      const serverData = await response.json();
      if (serverData && serverData.procedures && Array.isArray(serverData.procedures)) {
        // If server data is newer or has records, apply
        if (!this.currentState.lastUpdated || serverData.lastUpdated >= this.currentState.lastUpdated) {
          this.applyIncomingState({
            ...this.currentState,
            ...serverData,
            lastUpdated: serverData.lastUpdated || Date.now()
          }, false);
          this.lastSavedServerTime = serverData.lastUpdated;
          return true;
        } else {
          // Local data is newer than server, sync local data up to server
          this.pushToServer(this.currentState);
        }
      } else {
        // Server database is empty or new, seed current local state to server
        this.pushToServer(this.currentState);
      }
    } catch (err) {
      // Offline fallback: local cache continues working perfectly
      console.log('Server sync currently offline, using persistent local cache:', err);
    }
    return false;
  }

  // Push full state or updates to server disk storage
  public async pushToServer(stateToSave: SystemDatabaseState): Promise<boolean> {
    if (this.isSavingToServer) return false;
    this.isSavingToServer = true;

    try {
      const response = await fetch('/api/system/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stateToSave)
      });

      if (response.ok) {
        const resJson = await response.json();
        this.lastSavedServerTime = resJson.lastUpdated || Date.now();
        return true;
      }
    } catch (err) {
      console.log('Failed to save to server database, local storage preserved:', err);
    } finally {
      this.isSavingToServer = false;
    }
    return false;
  }

  // Periodic polling check to link Officer Admin CMS and Citizen view across different devices
  private startBackgroundSync() {
    if (this.syncInterval) clearInterval(this.syncInterval);

    this.syncInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/system/status', {
          headers: { Accept: 'application/json' }
        });
        if (res.ok) {
          const status = await res.json();
          if (status.lastUpdated && status.lastUpdated > this.currentState.lastUpdated) {
            // New changes made on another device/tab! Fetch updated database
            await this.fetchFromServer();
          }
        }
      } catch {
        // Silent catch for background heartbeat
      }
    }, 3500); // Check every 3.5 seconds
  }

  // Reset back to system factory defaults
  public async resetToDefaults() {
    const defaults = getInitialSystemDefaults();
    defaults.lastUpdated = Date.now();
    this.applyIncomingState(defaults, true);
    await this.pushToServer(defaults);
  }
}

export const systemStorage = new SystemStorageManager();
