import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlusIcon from '../../../components/icons/PlusIcon';
import TrashIcon from '../../../components/icons/TrashIcon'; // Make sure this exists or use a local one
import PencilIcon from '../../../components/icons/PencilIcon'; // Make sure this exists or use a local one
import ChevronDownIcon from '../../../components/icons/ChevronDownIcon'; // Use a local icon

import {
  InspectionGroup,
  InspectionEquipment,
  InspectionCheckpoint,
} from '../../../services/pocketbase';

interface TemplateManagerProps {
  groups: (InspectionGroup & {
    equipments: (InspectionEquipment & { checkPoints: InspectionCheckpoint[] })[];
  })[];
  onAddGroup: () => void;
  onUpdateGroup: (id: string, name: string) => void;
  onDeleteGroup: (id: string) => void;
  onAddEquipment: (groupId: string) => void;
  onUpdateEquipment: (id: string, name: string) => void;
  onDeleteEquipment: (id: string) => void;
  onAddCheckpoint: (equipmentId: string) => void;
  onUpdateCheckpoint: (id: string, name: string) => void;
  onDeleteCheckpoint: (id: string) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  groups,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAddEquipment,
  onUpdateEquipment,
  onDeleteEquipment,
  onAddCheckpoint,
  onUpdateCheckpoint,
  onDeleteCheckpoint,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedEquipments, setExpandedEquipments] = useState<Record<string, boolean>>({});

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleEquipment = (id: string) => {
    setExpandedEquipments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8 p-4 font-ubuntu">
      <div className="flex items-center justify-between mb-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-soft">
        <div>
          <h3 className="text-2xl font-bold text-ubuntu-coolGrey dark:text-white tracking-tight text-balance">
            Structure Editor
          </h3>
          <p className="text-[11px] font-bold text-ubuntu-warmGrey uppercase tracking-widest mt-1">
            Manage groups, equipment, and checkpoints
          </p>
        </div>
        <button
          onClick={onAddGroup}
          className="group flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-ubuntu-orange to-orange-600 hover:from-orange-500 hover:to-orange-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all active:scale-95"
        >
          <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          Add Group
        </button>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="group/groupItem bg-white dark:bg-slate-900 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-white/10 shadow-soft overflow-hidden transition-all duration-300"
          >
            <div className="p-6 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-5 flex-1">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                >
                  <ChevronDownIcon
                    className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${expandedGroups[group.id] ? 'rotate-180' : ''}`}
                  />
                </button>
                <div className="flex-1 relative group/input">
                  <input
                    value={group.name}
                    onChange={(e) => onUpdateGroup(group.id, e.target.value)}
                    className="bg-transparent font-bold text-ubuntu-coolGrey dark:text-white outline-none w-full italic text-xl tracking-tight focus:ring-2 ring-ubuntu-orange/20 rounded-xl px-3 transition-all placeholder:text-slate-300"
                    placeholder="Group Name..."
                  />
                  <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-ubuntu-orange/0 group-focus-within/input:bg-ubuntu-orange/50 transition-all rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center gap-3 pr-2">
                <button
                  onClick={() => onAddEquipment(group.id)}
                  className="p-3 text-slate-400 hover:text-ubuntu-orange hover:bg-ubuntu-orange/10 rounded-xl transition-all shadow-sm active:scale-90"
                  title="Add Equipment"
                >
                  <PlusIcon className="w-6 h-6" />
                </button>
                <button
                  onClick={() => onDeleteGroup(group.id)}
                  className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all shadow-sm active:scale-90"
                >
                  <TrashIcon className="w-6 h-6" />
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
                        className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm"
                      >
                        <div className="p-5 flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
                          <div className="flex items-center gap-5 flex-1">
                            <button
                              onClick={() => toggleEquipment(eq.id)}
                              className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm"
                            >
                              <ChevronDownIcon
                                className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${expandedEquipments[eq.id] ? 'rotate-180' : ''}`}
                              />
                            </button>
                            <input
                              value={eq.name}
                              onChange={(e) => onUpdateEquipment(eq.id, e.target.value)}
                              className="bg-transparent font-bold text-ubuntu-coolGrey dark:text-white outline-none w-full focus:ring-2 ring-ubuntu-orange/20 rounded-xl px-3 text-base transition-all placeholder:text-slate-300 italic"
                              placeholder="Equipment Name..."
                            />
                          </div>
                          <div className="flex items-center gap-2 pr-2">
                            <button
                              onClick={() => onAddCheckpoint(eq.id)}
                              className="p-2.5 text-slate-400 hover:text-ubuntu-orange hover:bg-ubuntu-orange/10 rounded-xl transition-all"
                            >
                              <PlusIcon className="w-6 h-6" />
                            </button>
                            <button
                              onClick={() => onDeleteEquipment(eq.id)}
                              className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedEquipments[eq.id] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="p-6 pl-14 space-y-4 bg-slate-50/50 dark:bg-slate-900/20"
                            >
                              {eq.checkPoints.map((cp) => (
                                <div
                                  key={cp.id}
                                  className="flex items-center gap-5 group/row transition-all duration-200"
                                >
                                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover/row:bg-ubuntu-orange group-hover/row:scale-125 transition-all shadow-sm" />
                                  <input
                                    value={cp.name}
                                    onChange={(e) => onUpdateCheckpoint(cp.id, e.target.value)}
                                    className="bg-transparent text-sm font-bold text-slate-500 dark:text-slate-400 outline-none flex-1 focus:ring-2 ring-ubuntu-orange/20 rounded-xl px-3 group-hover/row:text-ubuntu-coolGrey dark:group-hover/row:text-white transition-all placeholder:text-slate-200"
                                    placeholder="Checkpoint description..."
                                  />
                                  <button
                                    onClick={() => onDeleteCheckpoint(cp.id)}
                                    className="opacity-0 group-hover/row:opacity-100 p-2 text-slate-400 hover:text-rose-500 transition-all hover:bg-rose-500/10 rounded-lg"
                                  >
                                    <TrashIcon className="w-5 h-5" />
                                  </button>
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
