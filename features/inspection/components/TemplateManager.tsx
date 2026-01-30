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
    <div className="space-y-8 p-4">
      <div className="flex items-center justify-between mb-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-slate-200/50 dark:border-white/10 shadow-xl shadow-slate-200/5">
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Structure Editor
          </h3>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
            Manage groups, equipment, and checkpoints
          </p>
        </div>
        <button
          onClick={addGroup}
          className="group flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all active:scale-95"
        >
          <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          Add Group
        </button>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="group/groupItem bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-slate-200/50 dark:border-white/10 shadow-xl shadow-slate-200/5 overflow-hidden transition-all duration-300"
          >
            <div className="p-6 flex items-center justify-between bg-white/20 dark:bg-slate-800/20">
              <div className="flex items-center gap-5 flex-1">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                >
                  <ChevronDownIcon
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${expandedGroups[group.id] ? 'rotate-180' : ''}`}
                  />
                </button>
                <div className="flex-1 relative group/input">
                  <input
                    value={group.name}
                    onChange={(e) => updateItemName('group', group.id, e.target.value)}
                    className="bg-transparent font-black text-indigo-600 dark:text-indigo-400 outline-none w-full italic text-lg tracking-tight focus:ring-2 ring-indigo-500/10 rounded-xl px-2 transition-all"
                  />
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-500/0 group-focus-within/input:bg-indigo-500/50 transition-all rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => addEquipment(group.id)}
                  className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all"
                  title="Add Equipment"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => deleteGroup(group.id)}
                  className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                >
                  <TrashIcon className="w-5 h-5" />
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
                  <div className="p-6 pl-12 space-y-4">
                    {group.equipments.map((eq) => (
                      <div
                        key={eq.id}
                        className="bg-white/50 dark:bg-slate-800/30 rounded-3xl border border-slate-200/50 dark:border-white/10 overflow-hidden shadow-lg shadow-slate-200/5"
                      >
                        <div className="p-4 flex items-center justify-between bg-white/30 dark:bg-slate-900/20">
                          <div className="flex items-center gap-4 flex-1">
                            <button
                              onClick={() => toggleEquipment(eq.id)}
                              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                            >
                              <ChevronDownIcon
                                className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${expandedEquipments[eq.id] ? 'rotate-180' : ''}`}
                              />
                            </button>
                            <input
                              value={eq.name}
                              onChange={(e) => updateItemName('equipment', eq.id, e.target.value)}
                              className="bg-transparent font-extrabold text-slate-900 dark:text-white outline-none w-full focus:ring-2 ring-slate-500/10 rounded-lg px-2 text-sm transition-all"
                            />
                          </div>
                          <button
                            onClick={() => addCheckPoint(group.id, eq.id)}
                            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-all"
                          >
                            <PlusIcon className="w-5 h-5" />
                          </button>
                        </div>

                        <AnimatePresence>
                          {expandedEquipments[eq.id] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="p-4 pl-12 space-y-3 bg-slate-50/30 dark:bg-black/20"
                            >
                              {eq.checkPoints.map((cp) => (
                                <div
                                  key={cp.id}
                                  className="flex items-center gap-4 group/row transition-all duration-200"
                                >
                                  <div className="w-2 h-2 rounded-full bg-indigo-500/30 group-hover/row:bg-indigo-500 group-hover/row:scale-125 transition-all shadow-sm" />
                                  <input
                                    value={cp.name}
                                    onChange={(e) =>
                                      updateItemName('checkpoint', cp.id, e.target.value, {
                                        groupId: group.id,
                                        equipmentId: eq.id,
                                      })
                                    }
                                    className="bg-transparent text-sm font-bold text-slate-600 dark:text-slate-400 outline-none flex-1 focus:ring-2 ring-indigo-500/10 rounded-lg px-2 group-hover/row:text-slate-900 dark:group-hover/row:text-white transition-all"
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
