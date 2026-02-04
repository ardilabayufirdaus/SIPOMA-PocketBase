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
    <div className="flex flex-col h-full bg-inspection-50/10 dark:bg-inspection-950/20 backdrop-blur-3xl">
      <div className="p-8 border-b border-inspection-100 dark:border-inspection-800/50 flex items-center justify-between bg-white/40 dark:bg-inspection-900/40 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <div className="p-3 bg-gradient-to-br from-inspection-700 to-inspection-500 rounded-2xl text-white shadow-xl shadow-inspection-500/20">
            <ClipboardCheckIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-inspection-800 dark:text-white tracking-tight">
              Inspection Manager
            </h3>
            <p className="text-[11px] font-black text-inspection-500 dark:text-inspection-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-inspection-500 animate-pulse"></span>
              Super Admin Control
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-3 rounded-2xl bg-white/50 dark:bg-inspection-800/50 text-inspection-500 hover:text-rose-500 transition-all border border-inspection-100 dark:border-inspection-800/50 shadow-sm group"
        >
          <XMarkIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Internal Tabs */}
      <div className="px-8 pt-6">
        <div className="flex bg-inspection-100/50 dark:bg-inspection-800/30 p-1.5 rounded-[1.5rem] w-fit border border-inspection-200 dark:border-inspection-700/50 shadow-inner">
          <button
            onClick={() => {
              setActiveTab('units');
              resetForm();
            }}
            className={`px-8 py-3 rounded-2xl text-xs font-black transition-all duration-300 ${
              activeTab === 'units'
                ? 'bg-white dark:bg-inspection-700 text-inspection-700 dark:text-inspection-100 shadow-lg shadow-inspection-500/10'
                : 'text-inspection-400 hover:text-inspection-600 dark:hover:text-inspection-200'
            }`}
          >
            Units & Tabs
          </button>
          <button
            onClick={() => {
              setActiveTab('areas');
              resetForm();
            }}
            className={`px-8 py-3 rounded-2xl text-xs font-black transition-all duration-300 ${
              activeTab === 'areas'
                ? 'bg-white dark:bg-inspection-700 text-inspection-700 dark:text-inspection-100 shadow-lg shadow-inspection-500/10'
                : 'text-inspection-400 hover:text-inspection-600 dark:hover:text-inspection-200'
            }`}
          >
            Report Areas
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {isAdding ? (
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleSubmit}
            className="p-10 bg-white/40 dark:bg-inspection-950/40 backdrop-blur-md rounded-[3rem] border border-inspection-100 dark:border-inspection-800/50 shadow-2xl space-y-8"
          >
            <h4 className="text-xl font-black text-inspection-800 dark:text-white mb-4 flex items-center gap-3">
              <span className="w-2 h-8 bg-inspection-500 rounded-full"></span>
              {editingItem
                ? `Edit ${activeTab === 'units' ? 'Unit' : 'Area'}`
                : `Add New ${activeTab === 'units' ? 'Unit' : 'Area'}`}
            </h4>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-inspection-400 dark:text-inspection-500 uppercase tracking-[0.2em] mb-3 ml-1">
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
                  className="w-full px-6 py-4 bg-inspection-50 dark:bg-inspection-900/50 border border-inspection-100 dark:border-inspection-800/50 rounded-2xl text-base font-bold outline-none focus:ring-4 focus:ring-inspection-500/10 focus:border-inspection-500/50 transition-all shadow-inner text-inspection-800 dark:text-inspection-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                {activeTab === 'units' ? (
                  <div>
                    <label className="block text-[10px] font-black text-inspection-400 dark:text-inspection-500 uppercase tracking-[0.2em] mb-3 ml-1">
                      Parent Unit (Optional)
                    </label>
                    <div className="relative">
                      <select
                        value={formData.parent_id}
                        onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                        className="w-full px-6 py-4 bg-inspection-50 dark:bg-inspection-900/50 border border-inspection-100 dark:border-inspection-800/50 rounded-2xl text-base font-bold outline-none focus:ring-4 focus:ring-inspection-500/10 transition-all appearance-none shadow-inner text-inspection-800 dark:text-inspection-100"
                      >
                        <option value="" className="bg-white dark:bg-inspection-900">
                          None (Top Level)
                        </option>
                        {mainUnits
                          .filter((u) => u.id !== editingItem?.id)
                          .map((u) => (
                            <option
                              key={u.id}
                              value={u.id}
                              className="bg-white dark:bg-inspection-900"
                            >
                              {u.name}
                            </option>
                          ))}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-inspection-400">
                        <ChevronDownIcon className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-black text-inspection-400 dark:text-inspection-500 uppercase tracking-[0.2em] mb-3 ml-1">
                      Associated Unit
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-6 py-4 bg-inspection-50 dark:bg-inspection-900/50 border border-inspection-100 dark:border-inspection-800/50 rounded-2xl text-base font-bold outline-none focus:ring-4 focus:ring-inspection-500/10 transition-all appearance-none shadow-inner text-inspection-800 dark:text-inspection-100"
                      >
                        <option value="" className="bg-white dark:bg-inspection-900">
                          Select Unit...
                        </option>
                        {units.map((u) => (
                          <option
                            key={u.id}
                            value={u.id}
                            className="bg-white dark:bg-inspection-900"
                          >
                            {u.name} {u.parent_id ? '(Sub-tab)' : '(Main Tab)'}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-inspection-400">
                        <ChevronDownIcon className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-black text-inspection-400 dark:text-inspection-500 uppercase tracking-[0.2em] mb-3 ml-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData({ ...formData, sort_order: Number(e.target.value) })
                    }
                    className="w-full px-6 py-4 bg-inspection-50 dark:bg-inspection-900/50 border border-inspection-100 dark:border-inspection-800/50 rounded-2xl text-base font-bold outline-none focus:ring-4 focus:ring-inspection-500/10 focus:border-inspection-500/50 transition-all shadow-inner text-inspection-800 dark:text-inspection-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-6 pt-6">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-5 bg-inspection-50 dark:bg-inspection-800/50 text-inspection-600 dark:text-inspection-300 rounded-[2rem] font-black uppercase tracking-widest hover:bg-white dark:hover:bg-inspection-700 hover:text-inspection-800 dark:hover:text-inspection-100 transition-all border border-inspection-100 dark:border-inspection-800/50 shadow-sm active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-[2] py-5 bg-gradient-to-r from-inspection-700 to-inspection-500 hover:from-inspection-600 hover:to-inspection-400 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-inspection-500/30 hover:shadow-inspection-500/50 active:scale-[0.98]"
              >
                {editingItem ? 'Update Changes' : 'Create Item'}
              </button>
            </div>
          </motion.form>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-inspection-400 dark:text-inspection-500 uppercase tracking-[0.2em] ml-2">
                Existing {activeTab === 'units' ? 'Hierarchy' : 'Areas'}
              </h4>
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-inspection-700 to-inspection-500 hover:from-inspection-600 hover:to-inspection-400 text-white text-xs font-black rounded-2xl shadow-xl shadow-inspection-500/20 transition-all active:scale-95 uppercase tracking-widest"
              >
                <PlusIcon className="w-5 h-5" />
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
                        className="group bg-white/40 dark:bg-inspection-950/40 backdrop-blur-md rounded-[2.5rem] border border-inspection-100 dark:border-inspection-800/50 shadow-xl shadow-inspection-900/5 overflow-hidden transition-all duration-300"
                      >
                        <div className="p-6 flex items-center justify-between bg-inspection-50/30 dark:bg-inspection-900/30">
                          <div className="flex items-center gap-5">
                            <div className="w-10 h-10 rounded-2xl bg-inspection-500/10 text-inspection-600 dark:text-inspection-400 flex items-center justify-center font-black text-sm border border-inspection-500/20">
                              {unit.sort_order || 0}
                            </div>
                            <span className="font-black text-inspection-800 dark:text-inspection-100 text-lg tracking-tight italic">
                              {unit.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEdit(unit)}
                              className="p-3 text-inspection-400 hover:text-inspection-600 hover:bg-inspection-500/10 rounded-2xl transition-all shadow-sm active:scale-90"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => onDelete(unit.id)}
                              className="p-3 text-inspection-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all shadow-sm active:scale-90"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        {subUnits.length > 0 && (
                          <div className="p-6 pl-14 space-y-3 bg-inspection-50/5 dark:bg-black/20">
                            {subUnits.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between p-4 bg-white/60 dark:bg-inspection-900/40 rounded-2xl border border-inspection-100/50 dark:border-inspection-700/30 shadow-sm"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-2.5 h-2.5 rounded-full bg-inspection-500 shadow-lg shadow-inspection-500/50 animate-pulse" />
                                  <span className="text-sm font-black text-inspection-700 dark:text-inspection-200 italic">
                                    {sub.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => startEdit(sub)}
                                    className="p-2 text-inspection-400 hover:text-inspection-600 hover:bg-inspection-500/10 rounded-xl transition-all"
                                  >
                                    <PencilIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => onDelete(sub.id)}
                                    className="p-2 text-inspection-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                  >
                                    <TrashIcon className="w-4 h-4" />
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
                      <div key={unit.id} className="space-y-4">
                        <h5 className="text-[11px] font-black text-inspection-600 dark:text-inspection-400 uppercase tracking-[0.2em] ml-3 flex items-center gap-3">
                          <span className="w-6 h-1 bg-current rounded-full" />
                          {unit.name}
                        </h5>
                        <div className="grid grid-cols-1 gap-3">
                          {unitAreas.map((area) => (
                            <div
                              key={area.id}
                              className="flex items-center justify-between p-5 bg-white/40 dark:bg-inspection-950/40 backdrop-blur-md rounded-[2rem] border border-inspection-100 dark:border-inspection-800/50 shadow-xl shadow-inspection-900/5 group/areaItem"
                            >
                              <div className="flex items-center gap-5">
                                <div className="w-9 h-9 rounded-2xl bg-inspection-50 dark:bg-inspection-900/50 text-inspection-400 flex items-center justify-center text-xs font-black border border-inspection-100 dark:border-inspection-800/50">
                                  {area.sort_order || 0}
                                </div>
                                <span className="text-base font-black text-inspection-800 dark:text-inspection-100 tracking-tight">
                                  {area.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setTemplateAreaId(area.id)}
                                  className="p-3 text-inspection-500 hover:text-inspection-700 hover:bg-inspection-500/10 rounded-2xl transition-all shadow-sm active:scale-90"
                                  title="Manage Template"
                                >
                                  <ClipboardCheckIcon className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => startEdit(area)}
                                  className="p-3 text-inspection-400 hover:text-inspection-600 hover:bg-inspection-500/10 rounded-2xl transition-all shadow-sm active:scale-90"
                                >
                                  <PencilIcon className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => onDeleteArea(area.id)}
                                  className="p-3 text-inspection-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all shadow-sm active:scale-90"
                                >
                                  <TrashIcon className="w-5 h-5" />
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
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 z-50 bg-inspection-50/10 dark:bg-inspection-950/20 backdrop-blur-3xl flex flex-col pt-24"
          >
            <div className="flex items-center justify-between p-8 px-10 bg-white/40 dark:bg-inspection-900/40 backdrop-blur-md border-b border-inspection-100 dark:border-inspection-800/50 shadow-2xl">
              <div className="flex items-center gap-6">
                <div className="p-3 bg-gradient-to-br from-inspection-700 to-inspection-500 rounded-2xl text-white">
                  <ClipboardCheckIcon className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-inspection-800 dark:text-white tracking-tight">
                    Area Template Editor
                  </h4>
                  <p className="text-[11px] font-black text-inspection-500 dark:text-inspection-400 uppercase tracking-widest mt-1">
                    Area:{' '}
                    <span className="text-inspection-700 dark:text-inspection-200">
                      {areas.find((a) => a.id === templateAreaId)?.name}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTemplateAreaId(null)}
                className="px-8 py-3.5 bg-gradient-to-r from-inspection-700 to-inspection-500 hover:from-inspection-600 hover:to-inspection-400 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 active:scale-95 shadow-xl shadow-inspection-500/20"
              >
                <XMarkIcon className="w-5 h-5 group-hover:rotate-90 transition-transform" />
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

      <div className="p-10 border-t border-inspection-100 dark:border-inspection-800/50 bg-white/40 dark:bg-inspection-900/40 backdrop-blur-md">
        <button
          onClick={onClose}
          className="w-full py-5 bg-gradient-to-r from-inspection-900 to-inspection-800 hover:from-black hover:to-inspection-900 text-white rounded-[2rem] font-black transition-all shadow-2xl shadow-inspection-900/20 active:scale-[0.98] tracking-[0.2em] text-xs uppercase"
        >
          Close Manager
        </button>
      </div>
    </div>
  );
};

export default UnitManager;
