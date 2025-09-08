import { useState, useCallback, useEffect } from "react";
import { CcrDowntimeData } from "../types";
import { supabase } from "../utils/supabase";

const useCcrDowntimeData = () => {
  const [downtimeData, setDowntimeData] = useState<CcrDowntimeData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllDowntime = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ccr_downtime_data")
      .select("*");
    if (error) {
      console.error("Error fetching all downtime data:", error);
      setDowntimeData([]);
    } else {
      // FIX: Database sebenarnya sudah menggunakan snake_case, tidak perlu mapping
      const mappedData = ((data || []) as any[]).map((d) => ({
        id: d.id,
        date: d.date,
        start_time: d.start_time,
        end_time: d.end_time,
        pic: d.pic,
        problem: d.problem,
        unit: d.unit,
        action: d.action,
        corrective_action: d.corrective_action,
        status: d.status,
      }));
      setDowntimeData(mappedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAllDowntime();
  }, [fetchAllDowntime]);

  const getDowntimeForDate = useCallback(
    (date: string): CcrDowntimeData[] => {
      return downtimeData.filter((d) => d.date === date);
    },
    [downtimeData]
  );

  const getAllDowntime = useCallback((): CcrDowntimeData[] => {
    return downtimeData;
  }, [downtimeData]);

  const addDowntime = useCallback(
    async (record: Omit<CcrDowntimeData, "id">) => {
      try {
        // FIX: Database sudah menggunakan snake_case, tidak perlu mapping
        const payload = { ...record };
        const { error } = await supabase
          .from("ccr_downtime_data")
          .insert([payload as any]);
        if (error) {
          console.error("Error adding downtime:", error);
          throw new Error(`Failed to add downtime: ${error.message}`);
        }
        await fetchAllDowntime();
        return { success: true };
      } catch (error) {
        console.error("Error in addDowntime:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [fetchAllDowntime]
  );

  const updateDowntime = useCallback(
    async (updatedRecord: CcrDowntimeData) => {
      try {
        // FIX: Database sudah menggunakan snake_case, tidak perlu mapping
        const { id, ...payload } = updatedRecord;
        const { error } = await supabase
          .from("ccr_downtime_data")
          .update(payload as any)
          .eq("id", id);
        if (error) {
          console.error("Error updating downtime:", error);
          throw new Error(`Failed to update downtime: ${error.message}`);
        }
        await fetchAllDowntime();
        return { success: true };
      } catch (error) {
        console.error("Error in updateDowntime:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [fetchAllDowntime]
  );

  const deleteDowntime = useCallback(
    async (recordId: string) => {
      const { error } = await supabase
        .from("ccr_downtime_data")
        .delete()
        .eq("id", recordId);
      if (error) console.error("Error deleting downtime:", error);
      else fetchAllDowntime();
    },
    [fetchAllDowntime]
  );

  return {
    loading,
    getDowntimeForDate,
    getAllDowntime,
    addDowntime,
    updateDowntime,
    deleteDowntime,
  };
};

export default useCcrDowntimeData;
