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
  const [initialDraftFound, setInitialDraftFound] = useState(false);

  // Check server reachability independently of browser offline state
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

  // Show draft notice ONLY IF it was found initially
  // Standard UI: only suggest recovery on entry, don't nag while user is typing
  useEffect(() => {
    if (hasDraft && !dismissed && !initialDraftFound) {
      setShowDraftNotice(true);
      setInitialDraftFound(true);
    }
  }, [hasDraft, dismissed, initialDraftFound]);

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

  // Determine status for UI styling
  const getStatus = (): 'online' | 'offline' | 'syncing' | 'server-down' | 'pending' => {
    if (!isOnline) return 'offline';
    if (!serverReachable) return 'server-down';
    if (isSyncing) return 'syncing';
    if (pendingCount > 0) return 'pending';
    return 'online';
  };

  const status = getStatus();

  // Color configurations based on professional palette
  const statusConfig = {
    online: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      border: 'border-emerald-200 dark:border-emerald-800/50',
      text: 'text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
      label: 'SERVER ONLINE',
      desc: 'Semua data tersimpan aman di Cloud',
    },
    offline: {
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-200 dark:border-red-800/50',
      text: 'text-red-700 dark:text-red-300',
      dot: 'bg-red-500',
      label: 'JARINGAN OFFLINE',
      desc: 'Menunggu koneksi kembali...',
    },
    'server-down': {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-800/50',
      text: 'text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500',
      label: 'SERVER TIDAK TERJANGKAU',
      desc: 'Status server sedang diperiksa...',
    },
    syncing: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-800/50',
      text: 'text-blue-700 dark:text-blue-300',
      dot: 'bg-blue-500',
      label: 'SINKRONISASI...',
      desc: `Mengirim ${pendingCount} data ke server`,
    },
    pending: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-800/50',
      text: 'text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500 animate-pulse',
      label: 'DATA TERTUNDA',
      desc: `${pendingCount} entri menunggu antrean sinkron`,
    },
  };

  const config = statusConfig[status];

  return (
    <div className="w-full space-y-3 mb-6 font-sans">
      {/* Recovery Notice Overlay (Indonesian) */}
      {showDraftNotice && hasDraft && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700/50 rounded-xl p-4 flex items-center justify-between shadow-md transition-all duration-500 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-xl shadow-sm border border-blue-100 dark:border-blue-800">
              💾
            </div>
            <div>
              <h4 className="font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                Pemulihan Sesi Sebelumnya
                <span className="bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 text-[10px] px-1.5 py-0.5 rounded italic">
                  Draft Deteksi
                </span>
              </h4>
              <p className="text-sm text-blue-700/80 dark:text-blue-300/70">
                Data draf ditemukan dari pengerjaan terakhir. Ingin dipulihkan?
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDiscardDraft}
              className="px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-white/50 dark:hover:bg-gray-800 rounded-lg transition-all"
            >
              Abaikan
            </button>
            <button
              onClick={handleRecoverDraft}
              className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow-md transform active:scale-95 transition-all"
            >
              Pulihkan Data
            </button>
          </div>
        </div>
      )}

      {/* Modern Status Toolbar */}
      <div
        className={`${config.bg} ${config.border} border rounded-xl px-5 py-3.5 flex items-center justify-between shadow-sm transition-all duration-500`}
      >
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-3 h-3 rounded-full ${config.dot} shadow-sm`} />
              {status !== 'online' && (
                <div
                  className={`absolute -inset-1 rounded-full ${config.dot} animate-ping opacity-25`}
                />
              )}
            </div>
            <div className="flex flex-col">
              <span className={`font-black text-xs tracking-tighter ${config.text}`}>
                {config.label}
              </span>
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-widest leading-none">
                {config.desc}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {lastSyncTime && (
            <div className="hidden sm:flex flex-col items-end border-r border-gray-200 dark:border-gray-800 pr-5">
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-600 tracking-widest uppercase">
                Last Sync
              </span>
              <span className="text-xs font-bold tabular-nums text-gray-700 dark:text-gray-300">
                {lastSyncTime}
              </span>
            </div>
          )}

          {status === 'pending' || (pendingCount > 0 && isOnline) ? (
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 font-black text-[10px] tracking-widest shadow-sm hover:shadow-md hover:scale-[1.02] transform active:scale-95 disabled:opacity-50 transition-all"
            >
              {isSyncing ? 'SYNCING...' : `FORCE SYNC (${pendingCount})`}
            </button>
          ) : (
            status === 'online' &&
            pendingCount === 0 && (
              <div className="flex items-center gap-2 bg-emerald-100/50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full border border-emerald-500/20">
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Ready to go — Synced
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default CcrConnectionBanner;
