import { useState, useCallback, useEffect } from 'react';
import { WorkInstruction } from '../types';
import { supabase } from '../utils/supabase';

export const useWorkInstructions = () => {
  const [instructions, setInstructions] = useState<WorkInstruction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInstructions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('work_instructions')
      .select('*')
      .order('activity')
      .order('doc_title');

    if (error) {
      console.error('Error fetching work instructions:', error);
      setInstructions([]);
    } else {
      setInstructions((data || []) as any[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInstructions();
  }, [fetchInstructions]);

  const addInstruction = useCallback(
    async (instruction: Omit<WorkInstruction, 'id'>) => {
      const { error } = await supabase.from('work_instructions').insert([instruction]);
      if (error) console.error('Error adding work instruction:', error);
      else fetchInstructions();
    },
    [fetchInstructions]
  );

  const updateInstruction = useCallback(
    async (updatedInstruction: WorkInstruction) => {
      const { id, ...updateData } = updatedInstruction;
      const { error } = await supabase.from('work_instructions').update(updateData).eq('id', id);
      if (error) console.error('Error updating work instruction:', error);
      else fetchInstructions();
    },
    [fetchInstructions]
  );

  const deleteInstruction = useCallback(
    async (instructionId: string) => {
      const { error } = await supabase.from('work_instructions').delete().eq('id', instructionId);
      if (error) console.error('Error deleting work instruction:', error);
      else fetchInstructions();
    },
    [fetchInstructions]
  );

  return { instructions, loading, addInstruction, updateInstruction, deleteInstruction };
};
