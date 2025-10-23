import { useState, useCallback, useEffect } from 'react';
import { WorkInstruction } from '../types';
import { pb } from '../utils/pocketbase';

export const useWorkInstructions = () => {
  const [instructions, setInstructions] = useState<WorkInstruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstructions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('work_instructions').getFullList({
        sort: 'activity,doc_title',
      });
      // Transform RecordModel to WorkInstruction
      const transformedRecords = records.map((record) => ({
        id: record.id,
        activity: record.activity,
        doc_code: record.doc_code,
        doc_title: record.doc_title,
        description: record.description,
        link: record.link,
        plant_category: record.plant_category,
        plant_unit: record.plant_unit,
      })) as WorkInstruction[];

      setInstructions(transformedRecords);
    } catch (_error) {
      // eslint-disable-line @typescript-eslint/no-unused-vars
      setError('Failed to fetch work instructions');
      setInstructions([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInstructions();
  }, [fetchInstructions]);

  const addInstruction = useCallback(
    async (instruction: Omit<WorkInstruction, 'id'>) => {
      setError(null);
      try {
        await pb.collection('work_instructions').create(instruction);
        fetchInstructions();
      } catch (_error) {
        // eslint-disable-line @typescript-eslint/no-unused-vars
        setError('Failed to add work instruction');
      }
    },
    [fetchInstructions]
  );

  const updateInstruction = useCallback(
    async (updatedInstruction: WorkInstruction) => {
      setError(null);
      const { id, ...updateData } = updatedInstruction;
      try {
        await pb.collection('work_instructions').update(id, updateData);
        fetchInstructions();
      } catch (_error) {
        // eslint-disable-line @typescript-eslint/no-unused-vars
        setError('Failed to update work instruction');
      }
    },
    [fetchInstructions]
  );

  const deleteInstruction = useCallback(
    async (instructionId: string) => {
      setError(null);
      try {
        await pb.collection('work_instructions').delete(instructionId);
        fetchInstructions();
      } catch (_error) {
        // eslint-disable-line @typescript-eslint/no-unused-vars
        setError('Failed to delete work instruction');
      }
    },
    [fetchInstructions]
  );

  return { instructions, loading, error, addInstruction, updateInstruction, deleteInstruction };
};
