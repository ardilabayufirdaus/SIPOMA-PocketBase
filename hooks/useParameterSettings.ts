import { useState, useCallback, useEffect } from "react";
import { ParameterSetting } from "../types";
import { supabase } from "../utils/supabase";

export const useParameterSettings = () => {
  const [records, setRecords] = useState<ParameterSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("parameter_settings")
      .select("*")
      .order("parameter");

    if (error) {
      console.error("Error fetching parameter settings:", error);
      setRecords([]);
    } else {
      setRecords((data || []) as any[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const addRecord = useCallback(
    async (record: Omit<ParameterSetting, "id">) => {
      const { error } = await supabase
        .from("parameter_settings")
        .insert([record as any]);
      if (error) console.error("Error adding parameter setting:", error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const updateRecord = useCallback(
    async (updatedRecord: ParameterSetting) => {
      const { id, ...updateData } = updatedRecord;
      const { error } = await supabase
        .from("parameter_settings")
        .update(updateData as any)
        .eq("id", id);
      if (error) console.error("Error updating parameter setting:", error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      const { error } = await supabase
        .from("parameter_settings")
        .delete()
        .eq("id", recordId);
      if (error) console.error("Error deleting parameter setting:", error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const setAllRecords = useCallback(
    async (newRecords: Omit<ParameterSetting, "id">[]) => {
      try {
        // First, get all existing records to delete them properly
        const { data: existingRecords, error: fetchError } = await supabase
          .from("parameter_settings")
          .select("id");

        if (fetchError) {
          console.error(
            "Error fetching existing parameter settings:",
            fetchError
          );
          return;
        }

        // Delete all existing records if any exist
        if (existingRecords && existingRecords.length > 0) {
          const { error: deleteError } = await supabase
            .from("parameter_settings")
            .delete()
            .in(
              "id",
              existingRecords.map((r) => r.id)
            );

          if (deleteError) {
            console.error("Error clearing parameter settings:", deleteError);
            return;
          }
        }

        // Insert new records
        if (newRecords.length > 0) {
          const { error: insertError } = await supabase
            .from("parameter_settings")
            .insert(newRecords as any[]);

          if (insertError) {
            console.error(
              "Error bulk inserting parameter settings:",
              insertError
            );
            return;
          }
        }

        // Refresh the data
        fetchRecords();
      } catch (error) {
        console.error("Error in setAllRecords:", error);
      }
    },
    [fetchRecords]
  );

  return {
    records,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    setAllRecords,
  };
};
