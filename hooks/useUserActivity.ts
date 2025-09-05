import { useEffect } from "react";
import { supabase } from "../utils/supabase";

export const useUserActivity = (userId?: string) => {
  useEffect(() => {
    if (!userId) return;

    const updateLastActive = async () => {
      try {
        await supabase
          .from("users")
          .update({ last_active: new Date().toISOString() })
          .eq("id", userId);
      } catch (error) {
        console.error("Error updating last_active:", error);
      }
    };

    // Update immediately
    updateLastActive();

    // Update every 2 minutes while user is active
    const interval = setInterval(updateLastActive, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId]);
};
