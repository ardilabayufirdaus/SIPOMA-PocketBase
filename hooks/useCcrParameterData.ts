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
      // Enhanced validation for date parameter
      if (
        paramsLoading ||
        parameters.length === 0 ||
        !date ||
        typeof date !== "string" ||
        date.trim() === "" ||
        date === "undefined" ||
        date === "null"
      ) {
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
      // Enhanced validation for date parameter
      if (
        !date ||
        typeof date !== "string" ||
        date.trim() === "" ||
        date === "undefined" ||
        date === "null"
      ) {
        console.error("Invalid date provided to updateParameterData:", date);
        return;
      }

      // Check if we have valid parameter_id
      if (!parameter_id || typeof parameter_id !== "string") {
        console.error(
          "Invalid parameter_id provided to updateParameterData:",
          parameter_id
        );
        return;
      }

      try {
        // Check user session status (only log once per session)
        if (!(window as any)._userSessionChecked) {
          const userSession = localStorage.getItem("currentUser");
          if (userSession) {
            try {
              const sessionData = JSON.parse(userSession);
              console.log("User session active:", !!sessionData.id);
            } catch (error) {
              console.warn("Invalid user session data");
            }
          } else {
            console.log("No active user session");
          }
          (window as any)._userSessionChecked = true;
        }

        // Only log on development mode
        if (import.meta.env.DEV) {
          console.log("Attempting to fetch parameter data:", {
            date,
            parameter_id,
          });
        }

        // Try the query with proper error handling for 406 errors
        let existing = null;
        let fetchError = null;

        try {
          const result = await supabase
            .from("ccr_parameter_data")
            .select("*")
            .eq("date", date)
            .eq("parameter_id", parameter_id)
            .maybeSingle();

          existing = result.data;
          fetchError = result.error;
        } catch (networkError) {
          console.error("Network/HTTP error occurred:", networkError);
          // If it's a 406 error, try without .single() to see if that helps
          try {
            const fallbackResult = await supabase
              .from("ccr_parameter_data")
              .select("*")
              .eq("date", date)
              .eq("parameter_id", parameter_id)
              .limit(1);

            if (fallbackResult.data && fallbackResult.data.length > 0) {
              existing = fallbackResult.data[0];
              fetchError = null;
            } else {
              fetchError = fallbackResult.error || {
                code: "PGRST116",
                message: "No rows found",
              };
            }
          } catch (fallbackError) {
            console.error("Fallback query also failed:", fallbackError);
            throw fallbackError;
          }
        }

        if (fetchError) {
          console.error("Error fetching existing parameter data:", {
            error: fetchError,
            code: fetchError.code,
            message: fetchError.message,
            details: fetchError.details,
            hint: fetchError.hint,
          });

          if (fetchError.code !== "PGRST116") {
            return;
          }
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
