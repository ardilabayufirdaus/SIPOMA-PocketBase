/**
 * CcrConnectionBanner - Komponen banner status koneksi khusus CCR Data Entry
 *
 * Menampilkan:
 * - Status koneksi real-time (Online/Offline/Syncing)
 * - Jumlah operasi pending yang menunggu sinkronisasi
 * - Notifikasi recovery saat ditemukan draft yang belum tersimpan
 * - Tombol untuk memulihkan atau membuang draft
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { checkConnection } from '../../utils/connectionMonitor';

interface CcrConnectionBannerProps {
  pendingCount: number;
  isSyncing: boolean;
  hasDraft: boolean;
  lastSyncTime: string | null;
  onRecoverDraft?: () => void;
  onDiscardDraft?: () => void;
  onManualSync?: () => void;
}

const CcrConnectionBanner: React.FC<CcrConnectionBannerProps> = ({
  pendingCount,
  isSyncing,
  hasDraft,
  lastSyncTime,
  onRecoverDraft,
  onDiscardDraft,
  onManualSync,
}) => {
  const { isOnline } = useOfflineStatus();
  const [serverReachable, setServerReachable] = useState(true);
  const [showDraftNotice, setShowDraftNotice] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check server reachability
  useEffect(() => {
    const check = async () => {
      if (!isOnline) {
        setServerReachable(false);
        return;
      }
      try {
        const reachable = await checkConnection(5000);
        setServerReachable(reachable);
      } catch {
        setServerReachable(false);
      }
    };

    check();
    const interval = setInterval(check, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, [isOnline]);

  // Show draft notice on mount if draft exists
  useEffect(() => {
    if (hasDraft && !dismissed) {
      setShowDraftNotice(true);
    }
  }, [hasDraft, dismissed]);

  const handleRecoverDraft = useCallback(() => {
    setShowDraftNotice(false);
    setDismissed(true);
    onRecoverDraft?.();
  }, [onRecoverDraft]);

  const handleDiscardDraft = useCallback(() => {
    setShowDraftNotice(false);
    setDismissed(true);
    onDiscardDraft?.();
  }, [onDiscardDraft]);

  // Determine status
  const getStatus = (): 'online' | 'offline' | 'syncing' | 'server-down' | 'pending' => {
    if (!isOnline) return 'offline';
    if (!serverReachable) return 'server-down';
    if (isSyncing) return 'syncing';
    if (pendingCount > 0) return 'pending';
    return 'online';
  };

  const status = getStatus();

  // Status configurations
  const statusConfig = {
    online: {
      bgClass: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/50',
      dotClass: 'bg-emerald-500',
      textClass: 'text-emerald-700 dark:text-emerald-300',
      icon: '🟢',
      label: 'Server Online',
      description: 'Semua data tersimpan dengan aman',
    },
    offline: {
      bgClass: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700/50',
      dotClass: 'bg-red-500',
      textClass: 'text-red-700 dark:text-red-300',
      icon: '🔴',
      label: 'Jaringan Offline',
      description: 'Data disimpan lokal & akan sync otomatis saat online',
    },
    'server-down': {
      bgClass: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700/50',
      dotClass: 'bg-orange-500',
      textClass: 'text-orange-700 dark:text-orange-300',
      icon: '🟠',
      label: 'Server Tidak Terjangkau',
      description: 'Data disimpan lokal & akan sync otomatis saat server kembali',
    },
    syncing: {
      bgClass: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700/50',
      dotClass: 'bg-blue-500',
      textClass: 'text-blue-700 dark:text-blue-300',
      icon: '🔄',
      label: 'Sinkronisasi...',
      description: `Menyinkronkan ${pendingCount} data ke server`,
    },
    pending: {
      bgClass: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50',
      dotClass: 'bg-amber-500',
      textClass: 'text-amber-700 dark:text-amber-300',
      icon: '⏳',
      label: `${pendingCount} Data Pending`,
      description: 'Menunggu sinkronisasi ke server',
    },
  };

  const config = statusConfig[status];

  return (
    <>
      {/* Status Bar - Compact inline indicator */}
      <div
        className={`flex items-center justify-between px-4 py-2 rounded-xl border transition-all duration-300 ${config.bgClass}`}
      >
        <div className="flex items-center gap-3">
          {/* Animated dot */}
          <div className="relative flex items-center justify-center">
            <div
              className={`w-2.5 h-2.5 rounded-full ${config.dotClass} ${
                status !== 'online' ? 'animate-pulse' : ''
              }`}
            />
            {(status === 'syncing' || status === 'offline' || status === 'server-down') && (
              <div
                className={`absolute w-2.5 h-2.5 rounded-full ${config.dotClass} animate-ping opacity-75`}
              />
            )}
          </div>

          {/* Status text */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${config.textClass}`}>{config.label}</span>
            <span className={`text-xs ${config.textClass} opacity-70 hidden sm:inline`}>
              — {config.description}
            </span>
          </div>
        </div>

        {/* Right side: pending count + sync button */}
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                status === 'online'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-800/40 dark:text-amber-200'
                  : 'bg-white/50 dark:bg-white/10 ' + config.textClass
              }`}
            >
              {pendingCount} pending
            </span>
          )}

          {pendingCount > 0 && isOnline && serverReachable && !isSyncing && onManualSync && (
            <button
              onClick={onManualSync}
              className="text-xs px-2.5 py-1 rounded-lg bg-white/70 dark:bg-white/10 border border-current/20
                hover:bg-white dark:hover:bg-white/20 transition-colors font-medium"
              title="Sinkronkan data pending ke server"
            >
              Sync
            </button>
          )}

          {lastSyncTime && status === 'online' && pendingCount === 0 && (
            <span className="text-xs text-emerald-500/60 dark:text-emerald-400/50 hidden md:inline">
              ✓ Sync{' '}
              {new Date(lastSyncTime).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>

      {/* Draft Recovery Notice */}
      {showDraftNotice && hasDraft && (
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl border
            bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700/50
            transition-all duration-300 animate-in slide-in-from-top"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">💾</span>
            <div>
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                Ditemukan data yang belum tersimpan
              </p>
              <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70">
                Ada data dari sesi sebelumnya yang belum terkirim ke server. Pulihkan?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRecoverDraft}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg
                bg-indigo-600 text-white hover:bg-indigo-700
                transition-colors shadow-sm"
            >
              Pulihkan
            </button>
            <button
              onClick={handleDiscardDraft}
              className="px-3 py-1.5 text-xs font-medium rounded-lg
                bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-300
                border border-indigo-200 dark:border-indigo-600/30
                hover:bg-indigo-50 dark:hover:bg-white/20 transition-colors"
            >
              Abaikan
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CcrConnectionBanner;
