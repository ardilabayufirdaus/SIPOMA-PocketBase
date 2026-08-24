import { useState, useEffect, useCallback, useMemo } from 'react';
import { pb } from '../utils/pocketbase-simple';
import { ContractSLA, ContractSummaryStats, ContractFilterState } from '../types';

export interface EnrichedContract extends ContractSLA {
  daysRemaining: number;
  expiryStatus: 'expired' | 'critical' | 'warning' | 'active';
  volumeRemaining: number;
  volumeAbsorptionPct: number;
  budgetRemaining: number;
  budgetAbsorptionPct: number;
  isH90: boolean;
  isH30: boolean;
}

export const formatContractCurrency = (val: number, currency: string = 'IDR'): string => {
  const num = Number(val) || 0;
  const curr = (currency || 'IDR').toUpperCase();
  if (curr === 'USD') {
    return `$ ${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  if (curr === 'EUR') {
    return `€ ${num.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  return `Rp ${num.toLocaleString('id-ID')}`;
};

export const formatContractCurrencyCompact = (val: number, currency: string = 'IDR'): string => {
  const num = Number(val) || 0;
  const curr = (currency || 'IDR').toUpperCase();
  if (curr === 'USD') {
    if (num >= 1_000_000) {
      return `$ ${(num / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} M`;
    }
    if (num >= 1_000) {
      return `$ ${(num / 1_000).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} K`;
    }
    return `$ ${num.toLocaleString('en-US')}`;
  }
  if (curr === 'EUR') {
    if (num >= 1_000_000) {
      return `€ ${(num / 1_000_000).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} M`;
    }
    if (num >= 1_000) {
      return `€ ${(num / 1_000).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} K`;
    }
    return `€ ${num.toLocaleString('de-DE')}`;
  }
  // Default IDR
  if (num >= 1_000_000_000) {
    return `Rp ${(num / 1_000_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} M`;
  }
  if (num >= 1_000_000) {
    return `Rp ${(num / 1_000_000).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} Jt`;
  }
  return `Rp ${num.toLocaleString('id-ID')}`;
};

export const useContractsData = () => {
  const [rawContracts, setRawContracts] = useState<ContractSLA[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch contracts
  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('contracts_sla').getFullList<ContractSLA>({
        sort: '-created',
        requestKey: null,
      });
      setRawContracts(records);
    } catch (err: any) {
      console.error('Error fetching contracts:', err);
      setError(err?.message || 'Gagal memuat data kontrak');
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    fetchContracts();

    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      try {
        unsubscribe = await pb.collection('contracts_sla').subscribe('*', (e) => {
          if (e.action === 'create') {
            setRawContracts((prev) => [e.record as unknown as ContractSLA, ...prev]);
          } else if (e.action === 'update') {
            setRawContracts((prev) =>
              prev.map((c) => (c.id === e.record.id ? (e.record as unknown as ContractSLA) : c))
            );
          } else if (e.action === 'delete') {
            setRawContracts((prev) => prev.filter((c) => c.id !== e.record.id));
          }
        });
      } catch (subErr) {
        console.warn('Realtime subscription error on contracts_sla:', subErr);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [fetchContracts]);

  // Enrich contracts with calculated metrics (daysRemaining, budget/volume absorption, H-90, etc.)
  const contracts: EnrichedContract[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return rawContracts.map((c) => {
      let daysRemaining = 0;
      if (c.end_date) {
        const endDate = new Date(c.end_date);
        endDate.setHours(0, 0, 0, 0);
        daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }

      let expiryStatus: 'expired' | 'critical' | 'warning' | 'active' = 'active';
      if (daysRemaining < 0) {
        expiryStatus = 'expired';
      } else if (daysRemaining <= 30) {
        expiryStatus = 'critical';
      } else if (daysRemaining <= 90) {
        expiryStatus = 'warning';
      } else {
        expiryStatus = 'active';
      }

      const budget = Number(c.contract_budget || 0);
      const budgetAbsorbed = Number(c.budget_absorbed || 0);
      const budgetRemaining = Math.max(0, budget - budgetAbsorbed);
      const budgetAbsorptionPct = budget > 0 ? Math.min(100, (budgetAbsorbed / budget) * 100) : 0;

      const initialVol = Number(c.initial_volume || 0);
      const absorbedVol = Number(c.absorbed_volume || 0);
      const volumeRemaining = Math.max(0, initialVol - absorbedVol);
      const volumeAbsorptionPct =
        initialVol > 0 ? Math.min(100, (absorbedVol / initialVol) * 100) : 0;

      return {
        ...c,
        daysRemaining,
        expiryStatus,
        volumeRemaining,
        volumeAbsorptionPct,
        budgetRemaining,
        budgetAbsorptionPct,
        isH90: daysRemaining >= 0 && daysRemaining <= 90,
        isH30: daysRemaining >= 0 && daysRemaining <= 30,
      };
    });
  }, [rawContracts]);

  // Summary statistics
  const stats: ContractSummaryStats = useMemo(() => {
    let totalBudget = 0;
    let totalAbsorbedBudget = 0;
    let activeContracts = 0;
    let h90ExpiringContracts = 0;
    let h30CriticalContracts = 0;
    let expiredContracts = 0;
    const byCurrency: Record<string, any> = {};

    contracts.forEach((c) => {
      const curr = (c.currency || 'IDR').toUpperCase();
      if (!byCurrency[curr]) {
        byCurrency[curr] = {
          currency: curr,
          totalBudget: 0,
          totalAbsorbed: 0,
          totalRemaining: 0,
          absorptionPercentage: 0,
          contractCount: 0,
        };
      }
      const b = Number(c.contract_budget || 0);
      const a = Number(c.budget_absorbed || 0);
      byCurrency[curr].totalBudget += b;
      byCurrency[curr].totalAbsorbed += a;
      byCurrency[curr].totalRemaining += Math.max(0, b - a);
      byCurrency[curr].contractCount += 1;

      // Primary IDR sum
      if (curr === 'IDR') {
        totalBudget += b;
        totalAbsorbedBudget += a;
      }

      if (c.expiryStatus === 'expired') {
        expiredContracts++;
      } else {
        activeContracts++;
      }

      if (c.isH90) {
        h90ExpiringContracts++;
      }
      if (c.isH30) {
        h30CriticalContracts++;
      }
    });

    Object.values(byCurrency).forEach((item: any) => {
      item.absorptionPercentage =
        item.totalBudget > 0 ? (item.totalAbsorbed / item.totalBudget) * 100 : 0;
    });

    // If no IDR contracts exist but other currencies exist
    if (totalBudget === 0 && Object.keys(byCurrency).length > 0) {
      const firstCurr = Object.keys(byCurrency)[0];
      totalBudget = byCurrency[firstCurr].totalBudget;
      totalAbsorbedBudget = byCurrency[firstCurr].totalAbsorbed;
    }

    const overallAbsorptionPercentage =
      totalBudget > 0 ? (totalAbsorbedBudget / totalBudget) * 100 : 0;

    return {
      totalContracts: contracts.length,
      activeContracts,
      h90ExpiringContracts,
      h30CriticalContracts,
      expiredContracts,
      totalBudget,
      totalAbsorbedBudget,
      overallAbsorptionPercentage,
      byCurrency,
      activeCurrencies: Object.keys(byCurrency),
    };
  }, [contracts]);

  // Filter helper
  const filterContracts = useCallback(
    (filterState: ContractFilterState): EnrichedContract[] => {
      return contracts
        .filter((c) => {
          // 1. Text search
          if (filterState.search.trim()) {
            const query = filterState.search.toLowerCase();
            const matchPO = c.po_number?.toLowerCase().includes(query);
            const matchTitle = c.contract_title?.toLowerCase().includes(query);
            const matchVendor = c.vendor_name?.toLowerCase().includes(query);
            const matchPic = c.pic_name?.toLowerCase().includes(query);
            if (!matchPO && !matchTitle && !matchVendor && !matchPic) return false;
          }

          // 2. Category filter
          if (filterState.category && filterState.category !== 'all') {
            if (c.category !== filterState.category) return false;
          }

          // 3. Status filter
          if (filterState.status && filterState.status !== 'all') {
            if (c.status !== filterState.status) return false;
          }

          // 4. Currency filter (IDR, USD, EUR)
          if (filterState.currency && filterState.currency !== 'all') {
            const cCurr = (c.currency || 'IDR').toUpperCase();
            if (cCurr !== filterState.currency.toUpperCase()) return false;
          }

          // 5. Expiry H-90 Filter
          if (filterState.expiryFilter === 'h90') {
            if (!c.isH90) return false;
          } else if (filterState.expiryFilter === 'h30') {
            if (!c.isH30) return false;
          } else if (filterState.expiryFilter === 'expired') {
            if (c.expiryStatus !== 'expired') return false;
          } else if (filterState.expiryFilter === 'active') {
            if (c.expiryStatus === 'expired') return false;
          }

          return true;
        })
        .sort((a, b) => {
          switch (filterState.sortBy) {
            case 'end_date_asc':
              return a.end_date.localeCompare(b.end_date);
            case 'end_date_desc':
              return b.end_date.localeCompare(a.end_date);
            case 'budget_desc':
              return Number(b.contract_budget || 0) - Number(a.contract_budget || 0);
            case 'po_asc':
              return a.po_number.localeCompare(b.po_number);
            case 'created_desc':
            default:
              return (b.created || '').localeCompare(a.created || '');
          }
        });
    },
    [contracts]
  );

  // Helper to get full file URL from PocketBase
  const getFileUrl = useCallback((record: ContractSLA, filename?: string) => {
    if (!filename || !record) return '';
    return pb.files.getUrl(record as any, filename);
  }, []);

  // CRUD actions
  const createContract = useCallback(
    async (formData: FormData | Partial<ContractSLA>) => {
      const res = await pb.collection('contracts_sla').create(formData);
      await fetchContracts();
      return res;
    },
    [fetchContracts]
  );

  const updateContract = useCallback(
    async (id: string, formData: FormData | Partial<ContractSLA>) => {
      const res = await pb.collection('contracts_sla').update(id, formData);
      await fetchContracts();
      return res;
    },
    [fetchContracts]
  );

  const deleteContract = useCallback(
    async (id: string) => {
      const res = await pb.collection('contracts_sla').delete(id);
      await fetchContracts();
      return res;
    },
    [fetchContracts]
  );

  const updateRealization = useCallback(
    async (id: string, budget_absorbed: number, absorbed_volume: number) => {
      const res = await pb.collection('contracts_sla').update(id, {
        budget_absorbed,
        absorbed_volume,
      });
      await fetchContracts();
      return res;
    },
    [fetchContracts]
  );

  return {
    contracts,
    loading,
    error,
    stats,
    filterContracts,
    getFileUrl,
    createContract,
    updateContract,
    deleteContract,
    updateRealization,
    refetch: fetchContracts,
  };
};
