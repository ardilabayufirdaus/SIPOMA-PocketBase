import { useState, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabase";
import { useCurrentUser } from "./useCurrentUser";

export interface GlobalParameterSettings {
  id: string;
  user_id: string | null;
  plant_category: string | null;
  plant_unit: string | null;
  selected_parameters: string[];
  is_global: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

interface UseGlobalParameterSettingsReturn {
  settings: GlobalParameterSettings | null;
  loading: boolean;
  error: string | null;
  saveSettings: (
    selectedParameters: string[],
    plantCategory?: string,
    plantUnit?: string
  ) => Promise<void>;
  loadSettings: (plantCategory?: string, plantUnit?: string) => Promise<void>;
}

export const useGlobalParameterSettings =
  (): UseGlobalParameterSettingsReturn => {
    const [settings, setSettings] = useState<GlobalParameterSettings | null>(
      null
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { currentUser } = useCurrentUser();

    const loadSettings = useCallback(
      async (plantCategory?: string, plantUnit?: string) => {
        if (!currentUser) return;

        setLoading(true);
        setError(null);

        try {
          // Simplified query approach to avoid 406 errors
          let query = supabase.from("global_parameter_settings").select("*");

          if (currentUser.role === "Super Admin") {
            // Super Admin: Load global settings only
            query = query.eq("is_global", true);
          } else {
            // Regular users: Try to load their personal settings first
            query = query.eq("user_id", currentUser.id);
          }

          // Add plant filters if provided
          if (plantCategory) {
            query = query.eq("plant_category", plantCategory);
          }
          if (plantUnit) {
            query = query.eq("plant_unit", plantUnit);
          }

          const { data, error: fetchError } = await query
            .order("updated_at", { ascending: false })
            .limit(1);

          if (fetchError) {
            // If no personal settings found for regular users, try global settings
            if (
              currentUser.role !== "Super Admin" &&
              fetchError.code === "PGRST116"
            ) {
              let globalQuery = supabase
                .from("global_parameter_settings")
                .select("*")
                .eq("is_global", true);

              if (plantCategory) {
                globalQuery = globalQuery.eq("plant_category", plantCategory);
              }
              if (plantUnit) {
                globalQuery = globalQuery.eq("plant_unit", plantUnit);
              }

              const { data: globalData, error: globalError } = await globalQuery
                .order("updated_at", { ascending: false })
                .limit(1);

              if (globalError && globalError.code !== "PGRST116") {
                throw globalError;
              }

              setSettings(globalData?.[0] || null);
              return;
            }

            if (fetchError.code !== "PGRST116") {
              throw fetchError;
            }
          }

          const resultSettings = data?.[0] || null;
          setSettings(resultSettings);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to load settings"
          );
        } finally {
          setLoading(false);
        }
      },
      [currentUser]
    );

    const saveSettings = useCallback(
      async (
        selectedParameters: string[],
        plantCategory?: string,
        plantUnit?: string
      ) => {
        if (!currentUser) {
          throw new Error("User not authenticated");
        }

        setLoading(true);
        setError(null);

        try {
          const isGlobal = currentUser.role === "Super Admin";

          // Additional validation for global settings
          if (isGlobal && (!plantCategory || !plantUnit)) {
            throw new Error(
              "Plant category and unit are required for global settings"
            );
          }

          const settingsData = {
            user_id: isGlobal ? null : currentUser.id,
            plant_category: plantCategory || null,
            plant_unit: plantUnit || null,
            selected_parameters: selectedParameters,
            is_global: isGlobal,
            updated_at: new Date().toISOString(),
            updated_by: currentUser.email || currentUser.full_name || "system",
          };

          // Check if settings already exist with simplified query
          let existingQuery = supabase
            .from("global_parameter_settings")
            .select("id");

          if (isGlobal) {
            existingQuery = existingQuery
              .eq("is_global", true)
              .eq("plant_category", plantCategory)
              .eq("plant_unit", plantUnit);
          } else {
            existingQuery = existingQuery
              .eq("user_id", currentUser.id)
              .eq("is_global", false);

            if (plantCategory)
              existingQuery = existingQuery.eq("plant_category", plantCategory);
            if (plantUnit)
              existingQuery = existingQuery.eq("plant_unit", plantUnit);
          }

          const { data: existing, error: fetchError } =
            await existingQuery.limit(1);

          if (fetchError) {
            // Continue with insert if error checking existing
          }

          let result;
          if (existing && existing.length > 0) {
            // Update existing settings
            result = await supabase
              .from("global_parameter_settings")
              .update(settingsData)
              .eq("id", existing[0].id)
              .select();
          } else {
            // Create new settings
            result = await supabase
              .from("global_parameter_settings")
              .insert({
                ...settingsData,
                created_at: new Date().toISOString(),
              })
              .select();
          }

          if (result.error) {
            console.error("Save error:", result.error);
            throw result.error;
          }

          setSettings(result.data?.[0] || null);
        } catch (err) {
          console.error("Error saving global parameter settings:", err);
          setError(
            err instanceof Error ? err.message : "Failed to save settings"
          );
          throw err;
        } finally {
          setLoading(false);
        }
      },
      [currentUser]
    );

    // Auto-load settings when user changes
    useEffect(() => {
      if (currentUser) {
        loadSettings();
      }
    }, [currentUser]);

    return {
      settings,
      loading,
      error,
      saveSettings,
      loadSettings,
    };
  };
