import { useState, useCallback, useEffect } from 'react';
import { ClientResponseError } from 'pocketbase';
import { pb } from '../utils/pocketbase-simple';
import {
  InspectionReport,
  InspectionUnit,
  InspectionArea,
  InspectionGroup,
  InspectionEquipment,
  InspectionCheckpoint,
} from '../services/pocketbase';

export const useInspectionData = () => {
  const [inspections, setInspections] = useState<InspectionReport[]>([]);
  const [units, setUnits] = useState<InspectionUnit[]>([]);
  const [areas, setAreas] = useState<InspectionArea[]>([]);
  const [groups, setGroups] = useState<InspectionGroup[]>([]);
  const [equipments, setEquipments] = useState<InspectionEquipment[]>([]);
  const [checkpoints, setCheckpoints] = useState<InspectionCheckpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnits = useCallback(async () => {
    try {
      const records = await pb.collection('inspection_units').getFullList({
        sort: 'sort_order,name',
      });
      setUnits(records as unknown as InspectionUnit[]);
    } catch (err) {
      console.error('Error fetching units:', err);
    }
  }, []);

  const fetchAreas = useCallback(async () => {
    try {
      const records = await pb.collection('inspection_areas').getFullList({
        sort: 'sort_order,name',
      });
      setAreas(records as unknown as InspectionArea[]);
    } catch (err) {
      console.error('Error fetching areas:', err);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const records = await pb.collection('inspection_groups').getFullList({ sort: 'sort_order' });
      setGroups(records as unknown as InspectionGroup[]);
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  }, []);

  const fetchEquipments = useCallback(async () => {
    try {
      const records = await pb
        .collection('inspection_equipments')
        .getFullList({ sort: 'sort_order' });
      setEquipments(records as unknown as InspectionEquipment[]);
    } catch (err) {
      console.error('Error fetching equipments:', err);
    }
  }, []);

  const fetchCheckpoints = useCallback(async () => {
    try {
      const records = await pb
        .collection('inspection_checkpoints')
        .getFullList({ sort: 'sort_order' });
      setCheckpoints(records as unknown as InspectionCheckpoint[]);
    } catch (err) {
      console.error('Error fetching checkpoints:', err);
    }
  }, []);

  const fetchInspections = useCallback(async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('inspections').getList(1, 100, {
        sort: '-date',
      });

      const mappedData: InspectionReport[] = records.items.map((record: any) => ({
        id: record.id,
        date: record.date,
        unit: record.unit,
        area: record.area,
        status: record.status,
        s1_tender: record.s1_tender,
        s1_karu: record.s1_karu,
        s1_approved: record.s1_approved,
        s2_tender: record.s2_tender,
        s2_karu: record.s2_karu,
        s2_approved: record.s2_approved,
        s3_tender: record.s3_tender,
        s3_karu: record.s3_karu,
        s3_approved: record.s3_approved,
        data: record.data,
        created: record.created,
        updated: record.updated,
      }));

      setInspections(mappedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching inspections:', err);

      if (
        retryCount < 3 &&
        (errorMessage.includes('Failed to fetch') || errorMessage.includes('network'))
      ) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => fetchInspections(retryCount + 1), delay);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchUnits(),
        fetchAreas(),
        fetchGroups(),
        fetchEquipments(),
        fetchCheckpoints(),
        fetchInspections(),
      ]);
      setLoading(false);
    };
    init();
  }, [fetchUnits, fetchAreas, fetchGroups, fetchEquipments, fetchCheckpoints, fetchInspections]);

  // --- Administrative Functions ---

  const addUnit = async (data: Omit<InspectionUnit, 'id'>) => {
    try {
      await pb.collection('inspection_units').create(data);
      await fetchUnits();
    } catch (err) {
      console.error('Add unit failed:', err);
      throw err;
    }
  };

  const updateUnit = async (id: string, data: Partial<InspectionUnit>) => {
    try {
      await pb.collection('inspection_units').update(id, data);
      await fetchUnits();
    } catch (err) {
      console.error('Update unit failed:', err);
      throw err;
    }
  };

  const deleteUnit = async (id: string) => {
    try {
      await pb.collection('inspection_units').delete(id);
      await fetchUnits();
    } catch (err) {
      console.error('Delete unit failed:', err);
      throw err;
    }
  };

  const addArea = async (data: Omit<InspectionArea, 'id'>) => {
    try {
      await pb.collection('inspection_areas').create(data);
      await fetchAreas();
    } catch (err) {
      console.error('Add area failed:', err);
      throw err;
    }
  };

  const updateArea = async (id: string, data: Partial<InspectionArea>) => {
    try {
      await pb.collection('inspection_areas').update(id, data);
      await fetchAreas();
    } catch (err) {
      console.error('Update area failed:', err);
      throw err;
    }
  };

  const deleteArea = async (id: string) => {
    try {
      await pb.collection('inspection_areas').delete(id);
      await fetchAreas();
    } catch (err) {
      console.error('Delete area failed:', err);
      throw err;
    }
  };

  const addGroup = async (data: Omit<InspectionGroup, 'id'>) => {
    try {
      await pb.collection('inspection_groups').create(data);
      await fetchGroups();
    } catch (err) {
      console.error('Add group failed:', err);
      throw err;
    }
  };

  const updateGroup = async (id: string, data: Partial<InspectionGroup>) => {
    try {
      await pb.collection('inspection_groups').update(id, data);
      await fetchGroups();
    } catch (err) {
      console.error('Update group failed:', err);
      throw err;
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      await pb.collection('inspection_groups').delete(id);
      await fetchGroups();
    } catch (err) {
      console.error('Delete group failed:', err);
      throw err;
    }
  };

  const addEquipment = async (data: Omit<InspectionEquipment, 'id'>) => {
    try {
      await pb.collection('inspection_equipments').create(data);
      await fetchEquipments();
    } catch (err) {
      console.error('Add equipment failed:', err);
      throw err;
    }
  };

  const updateEquipment = async (id: string, data: Partial<InspectionEquipment>) => {
    try {
      await pb.collection('inspection_equipments').update(id, data);
      await fetchEquipments();
    } catch (err) {
      console.error('Update equipment failed:', err);
      throw err;
    }
  };

  const deleteEquipment = async (id: string) => {
    try {
      await pb.collection('inspection_equipments').delete(id);
      await fetchEquipments();
    } catch (err) {
      console.error('Delete equipment failed:', err);
      throw err;
    }
  };

  const addCheckpoint = async (data: Omit<InspectionCheckpoint, 'id'>) => {
    try {
      await pb.collection('inspection_checkpoints').create(data);
      await fetchCheckpoints();
    } catch (err) {
      console.error('Add checkpoint failed:', err);
      throw err;
    }
  };

  const updateCheckpoint = async (id: string, data: Partial<InspectionCheckpoint>) => {
    try {
      await pb.collection('inspection_checkpoints').update(id, data);
      await fetchCheckpoints();
    } catch (err) {
      console.error('Update checkpoint failed:', err);
      throw err;
    }
  };

  const deleteCheckpoint = async (id: string) => {
    try {
      await pb.collection('inspection_checkpoints').delete(id);
      await fetchCheckpoints();
    } catch (err) {
      console.error('Delete checkpoint failed:', err);
      throw err;
    }
  };

  const addInspection = useCallback(
    async (data: Omit<InspectionReport, 'id' | 'created' | 'updated'>) => {
      try {
        await pb.collection('inspections').create(data);
        await fetchInspections();
      } catch (err) {
        console.error('Add inspection failed:', err);
        throw err;
      }
    },
    [fetchInspections]
  );

  const updateInspection = useCallback(
    async (id: string, data: Partial<InspectionReport>) => {
      try {
        await pb.collection('inspections').update(id, data);
        await fetchInspections();
      } catch (err) {
        console.error('Update inspection failed:', err);
        throw err;
      }
    },
    [fetchInspections]
  );

  const deleteInspection = useCallback(
    async (id: string) => {
      try {
        await pb.collection('inspections').delete(id);
        await fetchInspections();
      } catch (err) {
        console.error('Delete inspection failed:', err);
        throw err;
      }
    },
    [fetchInspections]
  );

  return {
    inspections,
    units,
    areas,
    groups,
    equipments,
    checkpoints,
    loading,
    error,
    addUnit,
    updateUnit,
    deleteUnit,
    addArea,
    updateArea,
    deleteArea,
    addGroup,
    updateGroup,
    deleteGroup,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    addCheckpoint,
    updateCheckpoint,
    deleteCheckpoint,
    addInspection,
    updateInspection,
    deleteInspection,
    refetch: fetchInspections,
    refreshUnits: fetchUnits,
    refreshAreas: fetchAreas,
    refreshGroups: fetchGroups,
    refreshEquipments: fetchEquipments,
    refreshCheckpoints: fetchCheckpoints,
  };
};
