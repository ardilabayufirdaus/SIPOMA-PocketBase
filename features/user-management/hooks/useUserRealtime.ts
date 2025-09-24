import { useEffect } from 'react';
import { useUserStore } from '../../../stores/userStore';

export const useUserRealtime = () => {
  const initRealtimeSubscription = useUserStore((state) => (state as any).initRealtimeSubscription);

  useEffect(() => {
    if (initRealtimeSubscription) {
      initRealtimeSubscription();
    }

    // Cleanup on unmount
    return () => {
      // If needed, unsubscribe here
    };
  }, [initRealtimeSubscription]);
};
