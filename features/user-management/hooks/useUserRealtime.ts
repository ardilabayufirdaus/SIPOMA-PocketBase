import { useEffect } from 'react';
import { useUserStore } from '../../../stores/userStore';

export const useUserRealtime = () => {
  const initRealtimeSubscription = useUserStore((state) => (state as any).initRealtimeSubscription);
  const cleanupRealtimeSubscription = useUserStore(
    (state) => (state as any).cleanupRealtimeSubscription
  );

  useEffect(() => {
    if (initRealtimeSubscription) {
      initRealtimeSubscription();
    }

    // Cleanup on unmount
    return () => {
      if (cleanupRealtimeSubscription) {
        cleanupRealtimeSubscription();
      }
    };
  }, [initRealtimeSubscription, cleanupRealtimeSubscription]);
};
