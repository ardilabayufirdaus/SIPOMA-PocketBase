import { useState, useEffect } from 'react';
import PocketBase from 'pocketbase/cjs';

export interface CopFooterParameter {
  id: string;
  plant_category: string;
  plant_unit: string;
  parameter_ids: string[] | null;
  created: string;
  updated: string;
}

export const useCopFooterParameters = () => {
  const [pb] = useState(
    () => new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site')
  );
  const [data, setData] = useState<CopFooterParameter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (plantCategory?: string, plantUnit?: string) => {
    console.log('🔍 useCopFooterParameters.fetchData called with:', { plantCategory, plantUnit });

    if (!pb) {
      console.error('❌ PocketBase not initialized in fetchData');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let filter = '';
      if (plantCategory && plantUnit) {
        filter = `plant_category = "${plantCategory}" && plant_unit = "${plantUnit}"`;
      } else if (plantCategory) {
        filter = `plant_category = "${plantCategory}"`;
      } else if (plantUnit) {
        filter = `plant_unit = "${plantUnit}"`;
      }

      console.log('🔍 Fetching with filter:', filter || 'none');

      const records = await pb.collection('cop_footer_parameters').getList(1, 50, {
        filter: filter || undefined,
        sort: 'created',
      });

      console.log('✅ Fetched records:', records.items.length);
      setData(records.items as unknown as CopFooterParameter[]);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch COP footer parameters');
    } finally {
      setLoading(false);
    }
  };

  const createRecord = async (data: Omit<CopFooterParameter, 'id' | 'created' | 'updated'>) => {
    console.log('🔍 useCopFooterParameters.createRecord called with:', data);
    console.log('🔍 Data validation:', {
      plant_category: data.plant_category ? 'present' : 'missing',
      plant_unit: data.plant_unit ? 'present' : 'missing',
      parameter_ids: data.parameter_ids ? 'present' : 'missing',
    });

    if (!pb) {
      console.error('❌ PocketBase not initialized');
      throw new Error('PocketBase not initialized');
    }

    // Check if authenticated
    console.log('🔐 Checking authentication...');
    console.log('Auth store isValid:', pb.authStore.isValid);
    console.log('Auth store model:', pb.authStore.model);

    if (!pb.authStore.isValid) {
      console.error('❌ PocketBase authentication failed');
      throw new Error('PocketBase authentication required');
    }

    try {
      console.log('📤 Sending create request to PocketBase...');
      console.log('Target URL:', `${pb.baseUrl}/api/collections/cop_footer_parameters/records`);
      const record = await pb.collection('cop_footer_parameters').create(data);
      console.log('✅ Record created successfully:', record);
      await fetchData(); // Refresh data
      return record;
    } catch (err) {
      console.error('❌ PocketBase create error:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        response: err.response,
        data: err.data,
      });
      throw err instanceof Error ? err : new Error('Failed to create record');
    }
  };

  const updateRecord = async (id: string, data: Partial<CopFooterParameter>) => {
    if (!pb) throw new Error('PocketBase not initialized');

    try {
      const record = await pb.collection('cop_footer_parameters').update(id, data);
      await fetchData(); // Refresh data
      return record;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update record');
    }
  };

  const deleteRecord = async (id: string) => {
    if (!pb) throw new Error('PocketBase not initialized');

    try {
      await pb.collection('cop_footer_parameters').delete(id);
      await fetchData(); // Refresh data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete record');
    }
  };

  useEffect(() => {
    fetchData();
  }, [pb]);

  return {
    data,
    loading,
    error,
    fetchData,
    createRecord,
    updateRecord,
    deleteRecord,
    refetch: () => fetchData(),
  };
};
