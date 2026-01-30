import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlusIcon from '../../../components/icons/PlusIcon';
import TrashIcon from '../../../components/icons/TrashIcon';
import PencilIcon from '../../../components/icons/PencilIcon';
import XMarkIcon from '../../../components/icons/XMarkIcon';
import ChevronDownIcon from '../../../components/icons/ChevronDownIcon';
import ClipboardCheckIcon from '../../../components/icons/ClipboardCheckIcon';
import {
  InspectionUnit,
  InspectionArea,
  InspectionGroup,
  InspectionEquipment,
  InspectionCheckpoint,
} from '../../../services/pocketbase';
import TemplateManager from './TemplateManager';
interface UnitManagerProps {
  units: InspectionUnit[];
  areas: InspectionArea[];
  onAdd: (data: Omit<InspectionUnit, 'id'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<InspectionUnit>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAddArea: (data: Omit<InspectionArea, 'id'>) => Promise<void>;
  onUpdateArea: (id: string, data: Partial<InspectionArea>) => Promise<void>;
  onDeleteArea: (id: string) => Promise<void>;
  groups: InspectionGroup[];
  equipments: InspectionEquipment[];
  checkpoints: InspectionCheckpoint[];
  onAddGroup: (data: Omit<InspectionGroup, 'id'>) => Promise<void>;
  onUpdateGroup: (id: string, name: string) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
  onAddEquipment: (data: Omit<InspectionEquipment, 'id'>) => Promise<void>;
  onUpdateEquipment: (id: string, name: string) => Promise<void>;
  onDeleteEquipment: (id: string) => Promise<void>;
  onAddCheckpoint: (data: Omit<InspectionCheckpoint, 'id'>) => Promise<void>;
  onUpdateCheckpoint: (id: string, name: string) => Promise<void>;
  onDeleteCheckpoint: (id: string) => Promise<void>;
  onClose: () => void;
}

const UnitManager: React.FC<UnitManagerProps> = ({
  units,
  areas,
  groups,
  equipments,
  checkpoints,
  onAdd,
  onUpdate,
  onDelete,
  onAddArea,
  onUpdateArea,
  onDeleteArea,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAddEquipment,
  onUpdateEquipment,
  onDeleteEquipment,
  onAddCheckpoint,
  onUpdateCheckpoint,
  onDeleteCheckpoint,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'units' | 'areas'>('units');
  const [editingItem, setEditingItem] = useState<InspectionUnit | InspectionArea | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [templateAreaId, setTemplateAreaId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    parent_id: '', // for units
    unit: '', // for areas
    sort_order: 0,
  });

  const mainUnits = units.filter((u) => !u.parent_id);

  // Helper to build nested template for an area
  const areaTemplate = templateAreaId
    ? groups
        .filter((g) => g.areaId === templateAreaId)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((g) => ({
          ...g,
          equipments: equipments
            .filter((e) => e.group === g.id)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((e) => ({
              ...e,
              checkPoints: checkpoints
                .filter((cp) => cp.equipment === e.id)
                .sort((a, b) => a.sort_order - b.sort_order),
            })),
        }))
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === 'units') {
        if (editingItem) {
          await onUpdate(editingItem.id, {
            name: formData.name,
            parent_id: formData.parent_id || undefined,
            sort_order: Number(formData.sort_order),
          });
        } else {
          await onAdd({
            name: formData.name,
            parent_id: formData.parent_id || undefined,
            sort_order: Number(formData.sort_order),
          });
        }
      } else {
        if (editingItem) {
          await onUpdateArea(editingItem.id, {
            name: formData.name,
            unit: formData.unit,
            sort_order: Number(formData.sort_order),
          });
        } else {
          await onAddArea({
            name: formData.name,
            unit: formData.unit,
            sort_order: Number(formData.sort_order),
          });
        }
      }
      resetForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setIsAdding(false);
    setFormData({ name: '', parent_id: '', unit: '', sort_order: 0 });
  };

  const startEdit = (item: InspectionUnit | InspectionArea) => {
    setEditingItem(item);
    setIsAdding(true);
    setFormData({
      name: item.name,
      parent_id: (item as InspectionUnit).parent_id || '',
      unit: (item as InspectionArea).unit || '',
      sort_order: item.sort_order || 0,
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xl">
      <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
            <ChevronDownIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Inspection Manager
            </h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-0.5">
              Super Admin Control
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-all shadow-sm border border-slate-200 dark:border-white/5"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Internal Tabs */}
      <div className="px-8 pt-6">
        <div className="flex bg-slate-200/50 dark:bg-white/5 p-1 rounded-2xl w-fit">
          <button
            onClick={() => {
              setActiveTab('units');
              resetForm();
            }}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'units'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Units & Tabs
          </button>
          <button
            onClick={() => {
              setActiveTab('areas');
              resetForm();
            }}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'areas'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Report Areas
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {isAdding ? (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="p-8 bg-white dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-xl space-y-6"
          >
            <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">
              {editingItem
                ? `Edit ${activeTab === 'units' ? 'Unit' : 'Area'}`
                : `Add New ${activeTab === 'units' ? 'Unit' : 'Area'}`}
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Name / Label
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={
                    activeTab === 'units' ? 'e.g., Unit of Production' : 'e.g., Area 1 - Raw Mill'
                  }
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                {activeTab === 'units' ? (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                      Parent Unit (Optional)
                    </label>
                    <select
                      value={formData.parent_id}
                      onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                    >
                      <option value="">None (Top Level)</option>
                      {mainUnits
                        .filter((u) => u.id !== editingItem?.id)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                      Associated Unit
                    </label>
                    <select
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                    >
                      <option value="">Select Unit...</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} {u.parent_id ? '(Sub-tab)' : '(Main Tab)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData({ ...formData, sort_order: Number(e.target.value) })
                    }
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 transition-all"
              >
                {editingItem ? 'Update Changes' : 'Create Item'}
              </button>
            </div>
          </motion.form>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">
                Existing {activeTab === 'units' ? 'Hierarchy' : 'Areas'}
              </h4>
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
              >
                <PlusIcon className="w-4 h-4" />
                Add New {activeTab === 'units' ? 'Unit' : 'Area'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {activeTab === 'units' ? (
                <>
                  {mainUnits.length === 0 && (
                    <div className="py-20 text-center bg-white/40 dark:bg-slate-800/40 rounded-[2.5rem] border border-dashed border-slate-300 dark:border-white/10">
                      <p className="text-slate-400 italic">No units configured yet.</p>
                    </div>
                  )}
                  {mainUnits.map((unit) => {
                    const subUnits = units.filter((u) => u.parent_id === unit.id);
                    return (
                      <div
                        key={unit.id}
                        className="group bg-white dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden"
                      >
                        <div className="p-5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black text-xs">
                              {unit.sort_order || 0}
                            </div>
                            <span className="font-bold text-slate-800 dark:text-slate-100 italic">
                              {unit.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEdit(unit)}
                              className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-all"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(unit.id)}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {subUnits.length > 0 && (
                          <div className="p-4 pl-12 space-y-2 bg-white/50 dark:bg-black/20">
                            {subUnits.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between p-3 bg-white/40 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-white/5"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm" />
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                    {sub.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => startEdit(sub)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-md transition-all"
                                  >
                                    <PencilIcon className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onDelete(sub.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md transition-all"
                                  >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                <>
                  {areas.length === 0 && (
                    <div className="py-20 text-center bg-white/40 dark:bg-slate-800/40 rounded-[2.5rem] border border-dashed border-slate-300 dark:border-white/10">
                      <p className="text-slate-400 italic">No areas configured yet.</p>
                    </div>
                  )}
                  {units.map((unit) => {
                    const unitAreas = areas.filter((a) => a.unit === unit.id);
                    if (unitAreas.length === 0) return null;
                    return (
                      <div key={unit.id} className="space-y-3">
                        <h5 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                          <span className="w-4 h-px bg-current opacity-20" />
                          {unit.name}
                        </h5>
                        <div className="grid grid-cols-1 gap-2">
                          {unitAreas.map((area) => (
                            <div
                              key={area.id}
                              className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center text-[10px] font-bold">
                                  {area.sort_order || 0}
                                </div>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                  {area.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setTemplateAreaId(area.id)}
                                  className="p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-all"
                                  title="Manage Template"
                                >
                                  <ClipboardCheckIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => startEdit(area)}
                                  className="p-2 text-slate-400 hover:text-indigo-500 rounded-lg transition-all"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onDeleteArea(area.id)}
                                  className="p-2 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {areas.filter((a) => !units.find((u) => u.id === a.unit)).length > 0 && (
                    <div className="space-y-3 pt-4">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">
                        Unlinked Areas
                      </h5>
                      {areas
                        .filter((a) => !units.find((u) => u.id === a.unit))
                        .map((area) => (
                          <div
                            key={area.id}
                            className="flex items-center justify-between p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10 shadow-sm"
                          >
                            <span className="text-sm font-bold text-rose-600/60 ">{area.name}</span>
                            <button
                              onClick={() => onDeleteArea(area.id)}
                              className="p-2 text-rose-400"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Template Editor Overlay */}
      <AnimatePresence>
        {templateAreaId && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="absolute inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col pt-20"
          >
            <div className="flex items-center justify-between p-6 px-8 border-b border-slate-200 dark:border-white/10">
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Area Template Editor
                </h4>
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">
                  Area: {areas.find((a) => a.id === templateAreaId)?.name}
                </p>
              </div>
              <button
                onClick={() => setTemplateAreaId(null)}
                className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-500 hover:text-rose-500 transition-all font-black text-[10px] uppercase flex items-center gap-2"
              >
                <XMarkIcon className="w-4 h-4" />
                DASHBOARD
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <TemplateManager
                groups={areaTemplate}
                onAddGroup={() =>
                  onAddGroup({
                    areaId: templateAreaId,
                    name: 'New Group',
                    sort_order: groups.length + 1,
                  })
                }
                onUpdateGroup={(id, name) => onUpdateGroup(id, name)}
                onDeleteGroup={onDeleteGroup}
                onAddEquipment={(groupId) =>
                  onAddEquipment({
                    group: groupId,
                    name: 'New Equipment',
                    sort_order: equipments.length + 1,
                  })
                }
                onUpdateEquipment={(id, name) => onUpdateEquipment(id, name)}
                onDeleteEquipment={onDeleteEquipment}
                onAddCheckpoint={(equipmentId) =>
                  onAddCheckpoint({
                    equipment: equipmentId,
                    name: 'New Checkpoint',
                    sort_order: checkpoints.length + 1,
                  })
                }
                onUpdateCheckpoint={(id, name) => onUpdateCheckpoint(id, name)}
                onDeleteCheckpoint={onDeleteCheckpoint}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-8 border-t border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50">
        <button
          onClick={onClose}
          className="w-full py-4 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-2xl font-black transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] tracking-widest text-[10px] uppercase"
        >
          Close Manager
        </button>
      </div>
    </div>
  );
};

export default UnitManager;
