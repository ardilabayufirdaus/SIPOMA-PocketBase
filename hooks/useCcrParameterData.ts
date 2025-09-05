import { useCallback } from "react";
import { CcrParameterData } from "../types";
import { useParameterSettings } from "./useParameterSettings";
import { supabase } from "../utils/supabase";

// Extend CcrParameterData interface untuk include name property
interface CcrParameterDataWithName extends CcrParameterData {
  name?: string;
}

export const useCcrParameterData = () => {
  const { records: parameters, loading: paramsLoading } =
    useParameterSettings();

  const getDataForDate = useCallback(
    async (date: string): Promise<CcrParameterDataWithName[]> => {
      if (paramsLoading || parameters.length === 0) {
        return [];
      }

      try {
        const { data, error } = await supabase
          .from("ccr_parameter_data")
          .select("*")
          .eq("date", date);

        if (error) {
          console.error("Error fetching CCR parameter data:", error);
          return [];
        }

        // Map supabase response to application type with proper error handling
        const supabaseData = (data || []) as any[];
        const dailyRecords = new Map(
          supabaseData.map((d) => [d.parameter_id, d])
        );

        return parameters.map((param) => {
          const record = dailyRecords.get(param.id);
          if (record) {
            return {
              id: record.id,
              parameter_id: record.parameter_id,
              date: record.date,
              hourly_values: record.hourly_values || {},
              name: record.name ?? undefined,
            } as CcrParameterDataWithName;
          }
          // Return empty record structure for parameters without data
          return {
            id: `${param.id}-${date}`,
            parameter_id: param.id,
            date: date,
            hourly_values: {},
            name: undefined,
          } as CcrParameterDataWithName;
        });
      } catch (error) {
        console.error("Error in getDataForDate:", error);
        return [];
      }
    },
    [parameters, paramsLoading]
  );

  const updateParameterData = useCallback(
    async (
      date: string,
      parameter_id: string,
      hour: number, // 1-24
      value: string | number | null,
      userName: string // nama user login
    ) => {
      try {
        const { data: existing, error: fetchError } = await supabase
          .from("ccr_parameter_data")
          .select("hourly_values")
          .eq("date", date)
          .eq("parameter_id", parameter_id)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("Error fetching existing parameter data", fetchError);
          return;
        }

        const currentHourlyValues =
          typeof existing?.hourly_values === "object" &&
          existing?.hourly_values !== null
            ? existing.hourly_values
            : {};

        let updatedHourlyValues = { ...currentHourlyValues };

        if (value === "" || value === null || value === undefined) {
          // Remove the hour key if input is cleared
          delete updatedHourlyValues[hour];
        } else {
          updatedHourlyValues[hour] = value;
        }

        // If all hourly_values are empty, delete the record from Supabase
        if (Object.keys(updatedHourlyValues).length === 0) {
          const { error: deleteError } = await supabase
            .from("ccr_parameter_data")
            .delete()
            .eq("date", date)
            .eq("parameter_id", parameter_id);

          if (deleteError) {
            console.error("Error deleting CCR parameter data:", deleteError);
            throw deleteError;
          }
        } else {
          // Upsert record dengan kolom name
          const { error: upsertError } = await supabase
            .from("ccr_parameter_data")
            .upsert(
              {
                date,
                parameter_id,
                hourly_values: updatedHourlyValues,
                name: userName,
              },
              { onConflict: "date,parameter_id" }
            );

          if (upsertError) {
            console.error("Error updating CCR parameter data:", upsertError);
            throw upsertError;
          }
        }
      } catch (error) {
        console.error("Error in updateParameterData:", error);
        throw error; // Re-throw untuk error handling di component
      }
    },
    []
  );

  return { getDataForDate, updateParameterData, loading: paramsLoading };
};
