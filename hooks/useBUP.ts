import { useEffect, useState } from "react";
import { BUP } from "../types/supabase";

export function useBUP() {
  const [data, setData] = useState<BUP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBUP() {
      setLoading(true);
      // TODO: Implement actual BUP data fetching when table is created
      setData([]);
      setError(null);
      setLoading(false);
    }
    fetchBUP();
  }, []);

  return { data, loading, error };
}
