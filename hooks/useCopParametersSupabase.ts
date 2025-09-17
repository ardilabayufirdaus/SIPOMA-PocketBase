import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

// Tabel: cop_parameters, kolom: id, parameter_ids (array string)
export const useCopParametersSupabase = () => {
  const [copParameterIds, setCopParameterIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Ambil data dari Supabase saat mount
  useEffect(() => {
    const fetchCopParameters = async () => {
      setLoading(true);
      const { data, error } = (await supabase
        .from('cop_parameters')
        .select('parameter_ids')
        .eq('id', 'default')
        .single()) as { data: { parameter_ids: string[] } | null; error: any };
      if (data && data.parameter_ids) {
        setCopParameterIds(data.parameter_ids);
      }
      setLoading(false);
    };
    fetchCopParameters();
  }, []);

  // Simpan ke Supabase
  const saveCopParameters = async (ids: string[]) => {
    setCopParameterIds(ids);
    await supabase
      .from('cop_parameters')
      .upsert({ id: 'default', parameter_ids: ids }, { onConflict: 'id' });
  };

  return { copParameterIds, setCopParameterIds: saveCopParameters, loading };
};
