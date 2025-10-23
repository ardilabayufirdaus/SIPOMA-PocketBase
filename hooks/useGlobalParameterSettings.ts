import { useState, useEffect, useCallback } from 'react';
import { pb } from '../utils/pocketbase';
import { useCurrentUser } from './useCurrentUser';

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

export const useGlobalParameterSettings = (): UseGlobalParameterSettingsReturn => {
  const [settings, setSettings] = useState<GlobalParameterSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useCurrentUser();

  const loadSettings = useCallback(
    async (plantCategory?: string, plantUnit?: string) => {
      if (!currentUser) return;

      setLoading(true);
      setError(null);

      try {
        let filter = '';

        if (currentUser.role === 'Super Admin') {
          // Super Admin: Load global settings only
          filter = 'is_global = true';
        } else {
          // Regular users: Try to load their personal settings first
          filter = `user_id = "${currentUser.id}"`;
        }

        // Add plant filters if provided
        if (plantCategory) {
          filter += `${filter ? ' && ' : ''}plant_category = "${plantCategory}"`;
        }
        if (plantUnit) {
          filter += `${filter ? ' && ' : ''}plant_unit = "${plantUnit}"`;
        }

        const records = await pb.collection('global_parameter_settings').getFullList({
          filter: filter,
          sort: '-updated_at',
        });

        if (records.length > 0) {
          setSettings(records[0] as unknown as GlobalParameterSettings);
          return;
        }

        // If no personal settings found for regular users, try global settings
        if (currentUser.role !== 'Super Admin') {
          let globalFilter = 'is_global = true';

          if (plantCategory) {
            globalFilter += ` && plant_category = "${plantCategory}"`;
          }
          if (plantUnit) {
            globalFilter += ` && plant_unit = "${plantUnit}"`;
          }

          const globalRecords = await pb.collection('global_parameter_settings').getFullList({
            filter: globalFilter,
            sort: '-updated_at',
          });

          setSettings(
            globalRecords.length > 0
              ? (globalRecords[0] as unknown as GlobalParameterSettings)
              : null
          );
          return;
        }

        setSettings(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    },
    [currentUser]
  );

  const saveSettings = useCallback(
    async (selectedParameters: string[], plantCategory?: string, plantUnit?: string) => {
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      setLoading(true);
      setError(null);

      try {
        const isGlobal = currentUser.role === 'Super Admin';

        // Additional validation for global settings
        if (isGlobal && (!plantCategory || !plantUnit)) {
          throw new Error('Plant category and unit are required for global settings');
        }

        const settingsData = {
          user_id: isGlobal ? null : currentUser.id,
          plant_category: plantCategory || null,
          plant_unit: plantUnit || null,
          selected_parameters: selectedParameters,
          is_global: isGlobal,
          updated_at: new Date().toISOString(),
          updated_by: currentUser.email || currentUser.full_name || 'system',
        };

        // Check if settings already exist
        let filter = '';

        if (isGlobal) {
          filter = `is_global = true && plant_category = "${plantCategory}" && plant_unit = "${plantUnit}"`;
        } else {
          filter = `user_id = "${currentUser.id}" && is_global = false`;

          if (plantCategory) filter += ` && plant_category = "${plantCategory}"`;
          if (plantUnit) filter += ` && plant_unit = "${plantUnit}"`;
        }

        const existingRecords = await pb.collection('global_parameter_settings').getFullList({
          filter: filter,
        });

        let result;
        if (existingRecords.length > 0) {
          // Update existing settings
          result = await pb
            .collection('global_parameter_settings')
            .update(existingRecords[0].id, settingsData);
        } else {
          // Create new settings
          result = await pb.collection('global_parameter_settings').create({
            ...settingsData,
            created_at: new Date().toISOString(),
          });
        }

        setSettings(result as unknown as GlobalParameterSettings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save settings');
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
