import { useEffect, useState } from "react";
import { BOR } from "../types/supabase";

export function useBOR() {
  const [data, setData] = useState<BOR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBOR() {
      setLoading(true);
      // TODO: Implement actual BOR data fetching when table is created
      setData([]);
      setError(null);
      setLoading(false);
    }
    fetchBOR();
  }, []);

  return { data, loading, error };
}
