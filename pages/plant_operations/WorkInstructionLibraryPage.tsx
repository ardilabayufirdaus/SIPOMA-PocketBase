import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useWorkInstructions } from '../../hooks/useWorkInstructions';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { usePermissions } from '../../utils/permissions';
import { usePlantOperationsAccess } from '../../hooks/usePlantOperationsAccess';
import { WorkInstruction } from '../../types';
import Modal from '../../components/Modal';
import WorkInstructionForm from './WorkInstructionForm';
import PlusIcon from '../../components/icons/PlusIcon';
import EditIcon from '../../components/icons/EditIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import LinkIcon from '../../components/icons/LinkIcon';
import ExclamationTriangleIcon from '../../components/icons/ExclamationTriangleIcon';
import MagnifyingGlassIcon from '../../components/icons/MagnifyingGlassIcon';
import RealtimeIndicator from '../../components/ui/RealtimeIndicator';

const WorkInstructionLibraryPage: React.FC<{ t: any }> = ({ t }) => {
  const { instructions, loading, error, addInstruction, updateInstruction, deleteInstruction } =
    useWorkInstructions();
  const { records: plantUnits } = usePlantUnits();

  const { currentUser: loggedInUser } = useCurrentUser();
  const permissionChecker = usePermissions(loggedInUser);
  const { canWrite } = usePlantOperationsAccess('CM');

  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const [editingInstruction, setEditingInstruction] = useState<WorkInstruction | null>(null);
  const [deletingInstructionId, setDeletingInstructionId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterActivity, setFilterActivity] = useState('');
  const [filterPlantCategory, setFilterPlantCategory] = useState('');
  const [filterPlantUnit, setFilterPlantUnit] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('doc_code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleOpenAddModal = useCallback(() => {
    setEditingInstruction(null);
    setFormModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((instruction: WorkInstruction) => {
    setEditingInstruction(instruction);
    setFormModalOpen(true);
  }, []);

  const handleOpenDeleteModal = (instructionId: string) => {
    setDeletingInstructionId(instructionId);
    setDeleteModalOpen(true);
  };

  const handleCloseModals = useCallback(() => {
    setFormModalOpen(false);
    setDeleteModalOpen(false);
    setEditingInstruction(null);
    setDeletingInstructionId(null);
  }, []);

  const handleSave = useCallback(
    (instruction: WorkInstruction | Omit<WorkInstruction, 'id'>) => {
      if ('id' in instruction) {
        updateInstruction(instruction as WorkInstruction);
      } else {
        addInstruction(instruction);
      }
      handleCloseModals();
    },
    [addInstruction, updateInstruction, handleCloseModals]
  );

  const handleDeleteConfirm = useCallback(() => {
    if (deletingInstructionId) {
      deleteInstruction(deletingInstructionId);
    }
    handleCloseModals();
  }, [deletingInstructionId, deleteInstruction, handleCloseModals]);

  const handleSort = useCallback(
    (column: string) => {
      if (sortColumn === column) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortColumn(column);
        setSortDirection('asc');
      }
    },
    [sortColumn, sortDirection]
  );

  const groupedInstructions = useMemo(() => {
    // First filter instructions based on search term and filters
    const filtered = instructions.filter((instruction) => {
      const matchesSearch =
        !searchTerm ||
        instruction.doc_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instruction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instruction.doc_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instruction.plant_category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesActivity = !filterActivity || instruction.activity === filterActivity;
      const matchesPlantCategory =
        !filterPlantCategory || instruction.plant_category === filterPlantCategory;
      const matchesPlantUnit = !filterPlantUnit || instruction.plant_unit === filterPlantUnit;

      return matchesSearch && matchesActivity && matchesPlantCategory && matchesPlantUnit;
    });

    // Sort filtered instructions
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any = a[sortColumn as keyof WorkInstruction];
      let bValue: any = b[sortColumn as keyof WorkInstruction];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    const grouped = sorted.reduce(
      (acc, instruction) => {
        const activity = instruction.activity;
        if (!acc[activity]) {
          acc[activity] = [];
        }
        acc[activity].push(instruction);
        return acc;
      },
      {} as Record<string, WorkInstruction[]>
    );

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [
    instructions,
    searchTerm,
    filterActivity,
    filterPlantCategory,
    filterPlantUnit,
    sortColumn,
    sortDirection,
  ]);

  const tableHeaders = [
    'doc_code',
    'doc_title',
    'plant_category',
    'plant_unit',
    'description',
    'link',
    'actions',
  ];

  return (
    <div className="w-full space-y-4 sm:space-y-5 font-sans">
      {/* Hero Header Section - 20 Aturan Wajib */}
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary-900 via-slate-900 to-secondary-950 rounded-xl shadow-md border border-slate-800 p-4 sm:p-5 text-white w-full">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Plant Operations
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 rounded-full">
                  WI Library
                </span>
                <RealtimeIndicator isConnected={true} lastUpdate={new Date()} />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                {t.op_work_instruction_library || 'Work Instruction Library'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-normal mt-0.5">
                Standard Operating Procedures (SOP), work instructions, and technical documentation
              </p>
            </div>
          </div>
          {canWrite && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg shadow-xs hover:shadow-sm transition-all min-h-[36px]"
            >
              <PlusIcon className="w-4 h-4" />
              <span>{t.add_data_button || 'Tambah Data'}</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Search Bar */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label
              htmlFor="search"
              className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
            >
              {t.search || 'Cari Dokumen'}
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder={t.search_placeholder || 'Cari judul, deskripsi, kode...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs font-medium transition-all min-h-[36px]"
              />
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <MagnifyingGlassIcon className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Activity Filter */}
          <div>
            <label
              htmlFor="activity-filter"
              className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
            >
              {t.activity || 'Aktivitas'}
            </label>
            <select
              id="activity-filter"
              value={filterActivity}
              onChange={(e) => setFilterActivity(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs font-medium transition-all cursor-pointer min-h-[36px]"
            >
              <option value="">{t.all_activities || 'Semua Aktivitas'}</option>
              {Array.from(new Set(instructions.map((i) => i.activity)))
                .sort()
                .map((activity) => (
                  <option key={activity} value={activity}>
                    {activity}
                  </option>
                ))}
            </select>
          </div>

          {/* Plant Category Filter */}
          <div>
            <label
              htmlFor="plant-category-filter"
              className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
            >
              Kategori Plant
            </label>
            <select
              id="plant-category-filter"
              value={filterPlantCategory}
              onChange={(e) => {
                setFilterPlantCategory(e.target.value);
                setFilterPlantUnit('');
              }}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs font-medium transition-all cursor-pointer min-h-[36px]"
            >
              <option value="">Semua Kategori</option>
              {Array.from(new Set(plantUnits.map((unit) => unit.category)))
                .sort()
                .map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
            </select>
          </div>

          {/* Plant Unit Filter */}
          <div>
            <label
              htmlFor="plant-unit-filter"
              className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
            >
              Unit Plant
            </label>
            <select
              id="plant-unit-filter"
              value={filterPlantUnit}
              onChange={(e) => setFilterPlantUnit(e.target.value)}
              disabled={!filterPlantCategory}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs font-medium transition-all cursor-pointer min-h-[36px]"
            >
              <option value="">Semua Unit</option>
              {plantUnits
                .filter((unit) => !filterPlantCategory || unit.category === filterPlantCategory)
                .map((unit) => (
                  <option key={unit.id} value={unit.unit}>
                    {unit.unit}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/60 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shadow-2xs">
              <LinkIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 font-display">
                {t.op_work_instruction_library || 'Daftar Instruksi Kerja (SOP)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Total {instructions.length} dokumen tersimpan
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2.5"></div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Memuat dokumen instruksi kerja...
              </span>
            </div>
          ) : error ? (
            <div className="text-center py-10 px-4">
              <div className="text-rose-600 mb-2">
                <ExclamationTriangleIcon className="w-7 h-7 mx-auto" />
              </div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-3">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-3.5 py-1.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 min-h-[36px] transition-colors text-xs shadow-xs"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <table
              className="min-w-full divide-y divide-slate-200 dark:divide-slate-800"
              role="table"
              aria-label="Work Instructions Library"
            >
              <thead className="bg-slate-700 dark:bg-slate-800 border-b border-slate-700">
                <tr>
                  {tableHeaders.map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-3 py-2.5 text-left text-[11px] font-bold text-white uppercase tracking-wider"
                    >
                      {header !== 'actions' && header !== 'link' ? (
                        <button
                          onClick={() => handleSort(header)}
                          className="flex items-center gap-1 hover:text-emerald-300 transition-colors uppercase tracking-wider"
                          aria-sort={
                            sortColumn === header
                              ? sortDirection === 'asc'
                                ? 'ascending'
                                : 'descending'
                              : 'none'
                          }
                          aria-label={`Sort by ${t[header] || header} ${sortColumn === header ? (sortDirection === 'asc' ? 'ascending' : 'descending') : ''}`}
                        >
                          {t[header] || header}
                          {sortColumn === header && (
                            <span className="text-emerald-300 font-bold" aria-hidden="true">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      ) : (
                        t[header] || header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/60">
                {groupedInstructions.map(([activity, instructionList]) => (
                  <React.Fragment key={activity}>
                    <tr>
                      <td
                        colSpan={tableHeaders.length}
                        className="px-3 py-1.5 bg-slate-100/90 dark:bg-slate-800/80 border-l-4 border-emerald-500"
                      >
                        <h3 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          {activity}
                        </h3>
                      </td>
                    </tr>
                    {instructionList.map((instruction) => (
                      <tr
                        key={instruction.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150"
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-mono">
                          <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {instruction.doc_code}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {instruction.doc_title}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-mono">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {instruction.plant_category}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-mono">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {instruction.plant_unit}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 max-w-sm line-clamp-2">
                          {instruction.description}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                          <a
                            href={instruction.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-800/60 font-semibold text-xs transition-colors"
                          >
                            <LinkIcon className="w-3 h-3" />
                            <span>Buka</span>
                          </a>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                          <div className="flex items-center justify-end space-x-1">
                            <motion.button
                              onClick={() => handleOpenEditModal(instruction)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleOpenEditModal(instruction);
                                }
                              }}
                              className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors min-h-[30px] min-w-[30px] inline-flex items-center justify-center"
                              aria-label={`Edit ${instruction.doc_title}`}
                              tabIndex={0}
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <EditIcon className="w-3.5 h-3.5" />
                            </motion.button>
                            {canWrite && (
                              <motion.button
                                onClick={() => handleOpenDeleteModal(instruction.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleOpenDeleteModal(instruction.id);
                                  }
                                }}
                                className="p-1 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors min-h-[30px] min-w-[30px] inline-flex items-center justify-center"
                                aria-label={`Delete ${instruction.doc_title}`}
                                tabIndex={0}
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                {groupedInstructions.length === 0 && (
                  <tr>
                    <td colSpan={tableHeaders.length} className="text-center py-12 px-4">
                      <div className="max-w-sm mx-auto flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                          <LinkIcon className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                          Tidak ada instruksi kerja ditemukan
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                          Coba ubah kata kunci pencarian atau reset filter yang dipilih
                        </p>
                        {(searchTerm ||
                          filterActivity ||
                          filterPlantCategory ||
                          filterPlantUnit) && (
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setFilterActivity('');
                              setFilterPlantCategory('');
                              setFilterPlantUnit('');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
                          >
                            Reset Filter
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
        title={
          editingInstruction
            ? t.edit_instruction_title || 'Edit Instruksi Kerja'
            : t.add_instruction_title || 'Tambah Instruksi Kerja'
        }
      >
        <WorkInstructionForm
          instructionToEdit={editingInstruction}
          onSave={handleSave}
          onCancel={handleCloseModals}
          t={t}
          readOnly={!canWrite}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModals}
        title={t.delete_confirmation_title || 'Konfirmasi Hapus'}
      >
        <div className="p-6">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {t.delete_confirmation_message ||
              'Apakah Anda yakin ingin menghapus instruksi kerja ini? Tindakan ini tidak dapat dibatalkan.'}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg border-t border-slate-200 dark:border-slate-700/60 gap-3">
          <button
            onClick={handleDeleteConfirm}
            className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-sm px-4 py-2.5 bg-rose-600 text-sm font-semibold text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 sm:w-auto min-h-[44px] transition-colors"
          >
            {t.confirm_delete_button || 'Hapus'}
          </button>
          <button
            onClick={handleCloseModals}
            className="mt-2 sm:mt-0 w-full inline-flex justify-center items-center rounded-xl border border-slate-300 dark:border-slate-600 shadow-sm px-4 py-2.5 bg-white dark:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 sm:w-auto min-h-[44px] transition-colors"
          >
            {t.cancel_button || 'Batal'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default WorkInstructionLibraryPage;
