import { useState } from 'react';

// Default IDs mimic the initial state from PlantOperationsMasterData
const initialCopParameterIds: string[] = ['ps1', 'ps2', 'ps4', 'ps9', 'ps18'];

// This is a simplified, non-persistent state management for COP parameters.
// In a real application, this would likely be a shared context or a global state manager like Redux/Zustand.
let copParameterIdsState = [...initialCopParameterIds];

export const useCopParameters = () => {
  const [ids, setIds] = useState(copParameterIdsState);

  const setCopParameterIds = (newIds: string[]) => {
    copParameterIdsState = newIds;
    setIds(newIds);
  };

  return { 
    copParameterIds: ids,
    setCopParameterIds 
  };
};
