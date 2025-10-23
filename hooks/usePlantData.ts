import { useState, useCallback, useEffect } from 'react';

export const usePlantData = () => {
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
  };
};

