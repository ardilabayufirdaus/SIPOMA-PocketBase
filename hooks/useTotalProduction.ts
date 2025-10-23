import { useState, useEffect } from 'react';
import { pb } from '../utils/pocketbase-simple';

const parameterIds = [
  'a3f7b380-1cad-41f3-b459-802d4c33da54',
  'fb58e1a8-d808-46fc-8123-c3a33899dfcc',
  '8d1d2e1e-b003-44f1-a946-50aed6b44fe8',
  '14bf978b-5f5f-4279-b0c1-b91eb8a28e3a',
  '0917556b-e2b7-466b-bc55-fc3a79bb9a25',
  'fe1548c9-2ee5-44a8-9105-3fa2922438f4',
];

export const useTotalProduction = () => {
  const [totalProduction, setTotalProduction] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTotalProduction = async () => {
      try {
        setLoading(true);
        const filter = parameterIds.map((id) => `parameter_id="${id}"`).join(' || ');
        const result = await pb.collection('ccr_footer_data').getFullList({
          filter: filter,
        });

        const data = result;

        if (data) {
          const sum = data.reduce((acc, row) => acc + (row.total || 0), 0);
          setTotalProduction(sum);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTotalProduction();
  }, []);

  return { totalProduction, loading, error };
};

