import { useState, useCallback, useEffect } from 'react';
import { pb } from '../utils/pocketbase-simple';
import { updateParameterDataFixed } from '../utils/parameterDataUpdater';
import { formatParameterDataFlat } from '../utils/formatParameterDataFlat';
import { CcrParameterDataFlat } from '../types/ccrParameterDataTypes';
import { useAuth } from './useAuth';

// Timeout for auto-save delay in ms
const AUTO_SAVE_DELAY = 1000;

/**
 * Simplified hook for managing CCR parameter data using the flat structure
 * This version is focused on simplicity and reliability
 */
export const useCcrParameterDataSimple = (
  date: string,
  setErrorMessage?: (message: string) => void
) => {
  // State untuk parameter data
  const [parameterData, setParameterData] = useState<CcrParameterDataFlat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveQueue, setSaveQueue] = useState<
    Array<{
      date: string;
      parameter_id: string;
      hour: number;
      value: string | number | null;
    }>
  >([]);
  const { user } = useAuth();

  // Simpan perubahan secara individual, memungkinkan update cepat
  const saveParameterChange = useCallback(
    async (date: string, parameter_id: string, hour: number, value: string | number | null) => {
      if (!user?.username) {
        const errorMsg = 'User tidak terautentikasi. Silakan login ulang.';
        setError(errorMsg);
        setErrorMessage?.(errorMsg);
        return false;
      }

      try {
        await updateParameterDataFixed(date, parameter_id, hour, value, user.username);
        return true;
      } catch (error) {
        let errorMessage = 'Gagal menyimpan data parameter.';
        // Handle specific error types
        const err = error as { message?: string };
        if (err.message) {
          errorMessage += ` ${err.message}`;
        }

        setError(errorMessage);
        setErrorMessage?.(errorMessage);
        return false;
      }
    },
    [user, setErrorMessage]
  );

  // Handle perubahan data di antarmuka pengguna
  const handleParameterDataChange = useCallback(
    (parameterId: string, hour: number, value: string | number | null) => {
      // Format data menggunakan validator
      formatParameterDataFlat({
        date: date,
        parameter_id: parameterId,
      });

      // Format nilai sebelum melakukan update UI
      let formattedValue = value;
      if (value === '') {
        formattedValue = null;
      } else if (typeof value === 'string' && !isNaN(Number(value))) {
        // Jika string dapat dikonversi ke angka, simpan sebagai angka
        formattedValue = Number(value);
      }

      // Update state UI untuk respons cepat
      setParameterData((prevData) => {
        return prevData.map((paramData) => {
          if (paramData.parameter_id === parameterId) {
            const hourKey = `hour${hour}` as keyof CcrParameterDataFlat;
            const userKey = `hour${hour}_user` as keyof CcrParameterDataFlat;

            return {
              ...paramData,
              [hourKey]: formattedValue,
              [userKey]: user?.username || 'unknown',
            };
          }
          return paramData;
        });
      });

      // Tambahkan perubahan ke antrian simpan
      setSaveQueue((prev) => [
        ...prev,
        {
          date: date,
          parameter_id: parameterId,
          hour,
          value: formattedValue,
        },
      ]);
    },
    [date, user?.username]
  );

  // Tangani proses penyimpanan di antrian
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const processSaveQueue = async () => {
      // Ambil item pertama dan simpan
      const itemToSave = saveQueue[0];

      if (itemToSave) {
        const success = await saveParameterChange(
          itemToSave.date,
          itemToSave.parameter_id,
          itemToSave.hour,
          itemToSave.value
        );

        // Hapus dari antrian jika berhasil disimpan
        if (success) {
          setSaveQueue((prev) => prev.slice(1));
        } else {
          // Jika gagal, berhenti proses untuk memungkinkan error handling
          return;
        }
      }
    };

    // Proses antrian jika ada data
    if (saveQueue.length > 0) {
      timeoutId = setTimeout(processSaveQueue, AUTO_SAVE_DELAY);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [saveQueue, saveParameterChange]);

  // Ambil data parameter dari server
  const fetchParameterData = useCallback(async () => {
    if (!date) return;

    try {
      setLoading(true);
      setError(null);

      // Normalisasi format tanggal
      const normalizedDate = date.split('T')[0];

      const result = await pb.collection('ccr_parameter_data').getList(1, 100, {
        filter: `date="${normalizedDate}"`,
        sort: 'created',
        expand: 'parameter_id',
      });

      setParameterData(result.items as unknown as CcrParameterDataFlat[]);
    } catch (error) {
      const err = error as { message?: string };
      const errorMessage = `Error fetching parameter data: ${err.message || 'Unknown error'}`;
      setError(errorMessage);
      setErrorMessage?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [date, setErrorMessage]);

  // Muat data saat komponen dimuat atau tanggal berubah
  useEffect(() => {
    fetchParameterData();
  }, [fetchParameterData]);

  // Reset antrian saat tanggal berubah
  useEffect(() => {
    setSaveQueue([]);
  }, [date]);

  return {
    parameterData,
    loading,
    error,
    handleParameterDataChange,
    saveParameterChange,
    refreshData: fetchParameterData,
    pendingSaves: saveQueue.length,
  };
};

