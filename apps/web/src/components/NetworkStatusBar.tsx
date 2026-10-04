'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { OfflineStorage } from '../lib/offline-storage';


const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface NetworkStatusBarProps {
  onSyncComplete?: () => void;
}

export const NetworkStatusBar: React.FC<NetworkStatusBarProps> = ({ onSyncComplete }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [clockDriftAlert, setClockDriftAlert] = useState(false);

  const updateQueueStatus = () => {
    const q = OfflineStorage.getQueue();
    setQueueCount(q.length);
  };

  useEffect(() => {
    updateQueueStatus();
    setSimulatedOffline(OfflineStorage.isOfflineSimulated());
    const interval = setInterval(() => {
      updateQueueStatus();
      setSimulatedOffline(OfflineStorage.isOfflineSimulated());
    }, 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleStorageUpdate = () => {
      updateQueueStatus();
      setSimulatedOffline(OfflineStorage.isOfflineSimulated());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('offline-simulation-changed', handleStorageUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('offline-simulation-changed', handleStorageUpdate);
    };
  }, []);

  const effectiveOnline = isOnline && !simulatedOffline;

  const triggerSync = async () => {
    if (!effectiveOnline) {
      alert('Cannot synchronize while in offline mode. Please reconnect or disable offline simulation.');
      return;
    }

    const queue = OfflineStorage.getQueue();
    if (queue.length === 0) {
      setIsSyncing(true);
      setTimeout(() => {
        setIsSyncing(false);
        setLastSyncTime(new Date().toLocaleTimeString());
        if (onSyncComplete) onSyncComplete();
      }, 500);
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/sync/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'web-client-pwa-01',
          items: queue
        })
      });
      const data = await res.json();
      if (data.success) {
        OfflineStorage.clearQueue();
        updateQueueStatus();
        setLastSyncTime(new Date().toLocaleTimeString());
        const hasDrift = data.results?.some((r: any) => r.clockDriftReview);
        if (hasDrift) {
          setClockDriftAlert(true);
        }
        if (onSyncComplete) onSyncComplete();
      }
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-300">
      <div className="flex items-center gap-3">
        {/* Network Connection Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium ${
            effectiveOnline
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
          }`}
        >
          {effectiveOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span>{effectiveOnline ? 'ONLINE' : 'OFFLINE MODE'}</span>
        </div>

        {/* Demo Simulation Toggle */}
        <button
          id="btn-toggle-offline-simulation"
          onClick={() => {
            const next = !simulatedOffline;
            setSimulatedOffline(next);
            OfflineStorage.setOfflineSimulated(next);
            window.dispatchEvent(new Event('offline-simulation-changed'));
          }}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          title="Toggle network disconnect simulation for offline testing"
        >
          {simulatedOffline ? 'Restore Network (Simulate Intermittent Disconnect)' : 'Simulate Intermittent Disconnect'}
        </button>

        {/* Assessor Scope Badge */}
        <div className="hidden sm:flex items-center gap-1 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Assessor: ASR-01 (Verified Scope)</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {clockDriftAlert && (
          <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            <span>Clock Drift Review Flagged</span>
          </div>
        )}

        {/* Outbox Badge */}
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Outbox: <strong className="text-white">{queueCount}</strong> pending</span>
        </div>

        {/* Manual Sync Trigger */}
        <button
          onClick={triggerSync}
          disabled={isSyncing || !effectiveOnline}
          className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition ${
            effectiveOnline
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Outbox'}</span>
        </button>

        {lastSyncTime && (
          <span className="text-slate-500 text-[11px] hidden md:inline">Last sync: {lastSyncTime}</span>
        )}
      </div>
    </div>
  );
};
