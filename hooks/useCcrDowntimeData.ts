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
      // FIX: Map camelCase from Supabase to snake_case for application consistency.
      const mappedData = ((data || []) as any[]).map((d) => ({
        id: d.id,
        date: d.date,
        start_time: d.startTime,
        end_time: d.endTime,
        pic: d.pic,
        problem: d.problem,
        unit: d.unit,
        action: d.action,
        corrective_action: d.correctiveAction,
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
      // FIX: Map snake_case dari aplikasi ke snake_case untuk Supabase.
      const { start_time, end_time, corrective_action, ...rest } = record;
      const payload = { ...rest, start_time, end_time, corrective_action };
      const { error } = await supabase
        .from("ccr_downtime_data")
        .insert([payload as any]);
      if (error) console.error("Error adding downtime:", error);
      else fetchAllDowntime();
    },
    [fetchAllDowntime]
  );

  const updateDowntime = useCallback(
    async (updatedRecord: CcrDowntimeData) => {
      // FIX: Map snake_case dari aplikasi ke snake_case untuk Supabase.
      const { id, start_time, end_time, corrective_action, ...rest } =
        updatedRecord;
      const payload = { ...rest, start_time, end_time, corrective_action };
      const { error } = await supabase
        .from("ccr_downtime_data")
        .update(payload as any)
        .eq("id", id);
      if (error) console.error("Error updating downtime:", error);
      else fetchAllDowntime();
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
