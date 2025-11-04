import React, { useState, useEffect } from 'react';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { offlineDB } from '../utils/offlineDatabase';
import { getPendingConflicts } from '../utils/conflictResolution';
import './OfflineIndicator.css';

interface SyncStatus {
  isOnline: boolean;
  syncInProgress: boolean;
  queueLength: number;
}

/**
 * OfflineIndicator - Shows current offline/online status and sync progress
 * - Green: Online and synced
 * - Yellow: Online but syncing
 * - Red: Offline
 * - Blue: Conflicts detected
 */
const OfflineIndicator: React.FC = () => {
  const { isOnline } = useOfflineStatus();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    syncInProgress: false,
    queueLength: 0,
  });
  const [hasConflicts, setHasConflicts] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      const status = offlineDB.getSyncStatus();
      setSyncStatus(status);
      setHasConflicts(getPendingConflicts().length > 0);
    };

    // Update immediately
    updateStatus();

    // Update every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    // Listen for conflict events
    const handleConflict = () => setHasConflicts(true);
    window.addEventListener('conflict:detected', handleConflict);

    return () => {
      clearInterval(interval);
      window.removeEventListener('conflict:detected', handleConflict);
    };
  }, []);

  const getStatusColor = () => {
    if (hasConflicts) return '#2196f3'; // Blue for conflicts
    if (!isOnline) return '#f44336'; // Red for offline
    if (syncStatus.syncInProgress) return '#ff9800'; // Orange for syncing
    return '#4caf50'; // Green for online and synced
  };

  const getStatusText = () => {
    if (hasConflicts) return 'Konflik Data';
    if (!isOnline) return 'Offline';
    if (syncStatus.syncInProgress) return 'Sinkronisasi...';
    return 'Online';
  };

  const getStatusIcon = () => {
    if (hasConflicts) return '⚠️';
    if (!isOnline) return '🔴';
    if (syncStatus.syncInProgress) return '🔄';
    return '🟢';
  };

  return (
    <div className="offline-indicator">
      <div
        className="status-indicator"
        style={{ backgroundColor: getStatusColor() }}
        onClick={() => setShowDetails(!showDetails)}
        title="Klik untuk detail status"
      >
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-text">{getStatusText()}</span>
      </div>

      {showDetails && (
        <div className="status-details">
          <div className="detail-item">
            <strong>Koneksi:</strong> {isOnline ? 'Online' : 'Offline'}
          </div>
          <div className="detail-item">
            <strong>Status Sync:</strong>{' '}
            {syncStatus.syncInProgress ? 'Sedang sync' : 'Tersinkronisasi'}
          </div>
          <div className="detail-item">
            <strong>Antrian:</strong> {syncStatus.queueLength} operasi pending
          </div>
          {hasConflicts && (
            <div className="detail-item conflict-warning">
              <strong>Konflik:</strong> {getPendingConflicts().length} konflik perlu diselesaikan
            </div>
          )}
          <div className="detail-item">
            <small>
              Data tersimpan lokal akan otomatis disinkronisasi saat koneksi kembali normal.
            </small>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;
