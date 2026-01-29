import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlusIcon from '../../../components/icons/PlusIcon';
import TrashIcon from '../../../components/icons/TrashIcon'; // Make sure this exists or use a local one
import PencilIcon from '../../../components/icons/PencilIcon'; // Make sure this exists or use a local one
import ChevronDownIcon from '../../../components/icons/ChevronDownIcon'; // Use a local icon

interface CheckPoint {
  id: string;
  name: string;
}

interface Equipment {
  id: string;
  name: string;
  checkPoints: CheckPoint[];
}

interface Group {
  id: string;
  name: string;
  equipments: Equipment[];
}

interface TemplateManagerProps {
  groups: Group[];
  onUpdate: (updatedGroups: Group[]) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ groups, onUpdate }) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedEquipments, setExpandedEquipments] = useState<Record<string, boolean>>({});

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleEquipment = (id: string) => {
    setExpandedEquipments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Logic for Add/Edit/Delete
  const addGroup = () => {
    const newGroup: Group = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Group Category',
      equipments: [],
    };
    onUpdate([...groups, newGroup]);
  };

  const deleteGroup = (id: string) => {
    onUpdate(groups.filter((g) => g.id !== id));
  };

  const addEquipment = (groupId: string) => {
    const updated = groups.map((g) => {
      if (g.id === groupId) {
        return {
          ...g,
          equipments: [
            ...g.equipments,
            {
              id: Math.random().toString(36).substr(2, 9),
              name: 'New Equipment',
              checkPoints: [],
            },
          ],
        };
      }
      return g;
    });
    onUpdate(updated);
  };

  const addCheckPoint = (groupId: string, equipmentId: string) => {
    const updated = groups.map((g) => {
      if (g.id === groupId) {
        return {
          ...g,
          equipments: g.equipments.map((e) => {
            if (e.id === equipmentId) {
              return {
                ...e,
                checkPoints: [
                  ...e.checkPoints,
                  {
                    id: Math.random().toString(36).substr(2, 9),
                    name: 'New Check Point',
                  },
                ],
              };
            }
            return e;
          }),
        };
      }
      return g;
    });
    onUpdate(updated);
  };

  const updateItemName = (
    type: 'group' | 'equipment' | 'checkpoint',
    id: string,
    newName: string,
    parentIds?: { groupId?: string; equipmentId?: string }
  ) => {
    const updated = groups.map((g) => {
      if (type === 'group' && g.id === id) return { ...g, name: newName };

      if (parentIds?.groupId === g.id || type === 'equipment' || type === 'checkpoint') {
        return {
          ...g,
          equipments: g.equipments.map((e) => {
            if (type === 'equipment' && e.id === id) return { ...e, name: newName };

            if (parentIds?.equipmentId === e.id || type === 'checkpoint') {
              return {
                ...e,
                checkPoints: e.checkPoints.map((cp) => {
                  if (type === 'checkpoint' && cp.id === id) return { ...cp, name: newName };
                  return cp;
                }),
              };
            }
            return e;
          }),
        };
      }
      return g;
    });
    onUpdate(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Structure Editor</h3>
        <button
          onClick={addGroup}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
        >
          <PlusIcon className="w-4 h-4" />
          Add Group
        </button>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden"
          >
            <div className="p-4 flex items-center justify-between bg-white dark:bg-slate-800/50">
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <ChevronDownIcon
                    className={`w-5 h-5 text-slate-400 transition-transform ${expandedGroups[group.id] ? 'rotate-180' : ''}`}
                  />
                </button>
                <input
                  value={group.name}
                  onChange={(e) => updateItemName('group', group.id, e.target.value)}
                  className="bg-transparent font-bold text-indigo-600 dark:text-indigo-400 outline-none focus:ring-1 ring-indigo-500/30 rounded px-2 w-full italic"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => addEquipment(group.id)}
                  className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                  title="Add Equipment"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteGroup(group.id)}
                  className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {expandedGroups[group.id] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pl-12 space-y-3">
                    {group.equipments.map((eq) => (
                      <div
                        key={eq.id}
                        className="bg-white dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm"
                      >
                        <div className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <button onClick={() => toggleEquipment(eq.id)} className="p-1">
                              <ChevronDownIcon
                                className={`w-4 h-4 text-slate-400 ${expandedEquipments[eq.id] ? 'rotate-180' : ''}`}
                              />
                            </button>
                            <input
                              value={eq.name}
                              onChange={(e) => updateItemName('equipment', eq.id, e.target.value)}
                              className="bg-transparent font-bold text-slate-900 dark:text-white outline-none focus:ring-1 ring-slate-500/30 rounded px-2 w-full"
                            />
                          </div>
                          <button
                            onClick={() => addCheckPoint(group.id, eq.id)}
                            className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>

                        <AnimatePresence>
                          {expandedEquipments[eq.id] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="p-3 pl-10 space-y-2 bg-slate-50/50 dark:bg-black/10"
                            >
                              {eq.checkPoints.map((cp) => (
                                <div key={cp.id} className="flex items-center gap-3 group">
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                                  <input
                                    value={cp.name}
                                    onChange={(e) =>
                                      updateItemName('checkpoint', cp.id, e.target.value, {
                                        groupId: group.id,
                                        equipmentId: eq.id,
                                      })
                                    }
                                    className="bg-transparent text-sm text-slate-600 dark:text-slate-400 outline-none flex-1 focus:ring-1 ring-slate-500/30 rounded px-2"
                                  />
                                </div>
                              ))}
                              {eq.checkPoints.length === 0 && (
                                <p className="text-xs text-slate-400 italic">
                                  No check points added yet.
                                </p>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                    {group.equipments.length === 0 && (
                      <p className="text-sm text-slate-400 italic text-center py-4 bg-white/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-300 dark:border-white/10">
                        No equipment in this group.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateManager;
