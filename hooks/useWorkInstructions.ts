import { useState, useCallback, useEffect } from 'react';
import { WorkInstruction } from '../types';
import { supabase } from '../utils/supabase';

export const useWorkInstructions = () => {
  const [instructions, setInstructions] = useState<WorkInstruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstructions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('work_instructions')
      .select('*')
      .order('activity')
      .order('doc_title');

    if (error) {
      setError('Failed to fetch work instructions');
      setInstructions([]);
    } else {
      setInstructions((data || []) as unknown as WorkInstruction[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInstructions();
  }, [fetchInstructions]);

  const addInstruction = useCallback(
    async (instruction: Omit<WorkInstruction, 'id'>) => {
      setError(null);
      const { error } = await supabase.from('work_instructions').insert([instruction]);
      if (error) {
        setError('Failed to add work instruction');
      } else {
        fetchInstructions();
      }
    },
    [fetchInstructions]
  );

  const updateInstruction = useCallback(
    async (updatedInstruction: WorkInstruction) => {
      setError(null);
      const { id, ...updateData } = updatedInstruction;
      const { error } = await supabase.from('work_instructions').update(updateData).eq('id', id);
      if (error) {
        setError('Failed to update work instruction');
      } else {
        fetchInstructions();
      }
    },
    [fetchInstructions]
  );

  const deleteInstruction = useCallback(
    async (instructionId: string) => {
      setError(null);
      const { error } = await supabase.from('work_instructions').delete().eq('id', instructionId);
      if (error) {
        setError('Failed to delete work instruction');
      } else {
        fetchInstructions();
      }
    },
    [fetchInstructions]
  );

  return { instructions, loading, error, addInstruction, updateInstruction, deleteInstruction };
};
