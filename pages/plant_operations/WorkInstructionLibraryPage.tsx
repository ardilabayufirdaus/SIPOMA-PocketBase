import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useWorkInstructions } from '../../hooks/useWorkInstructions';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import { WorkInstruction } from '../../types';
import Modal from '../../components/Modal';
import WorkInstructionForm from './WorkInstructionForm';
import PlusIcon from '../../components/icons/PlusIcon';
import EditIcon from '../../components/icons/EditIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import LinkIcon from '../../components/icons/LinkIcon';
import ExclamationTriangleIcon from '../../components/icons/ExclamationTriangleIcon';

const WorkInstructionLibraryPage: React.FC<{ t: any }> = ({ t }) => {
  const { instructions, loading, error, addInstruction, updateInstruction, deleteInstruction } =
    useWorkInstructions();
  const { records: plantUnits } = usePlantUnits();

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
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
          {t.op_work_instruction_library}
        </h2>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-all duration-200"
        >
          <PlusIcon className="w-5 h-5" />
          {t.add_data_button}
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="sr-only">
            Search work instructions
          </label>
          <div className="relative">
            <input
              id="search"
              type="text"
              placeholder={t.search_placeholder || 'Search by title, description, code...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
        <div className="sm:w-64">
          <label htmlFor="activity-filter" className="sr-only">
            Filter by activity
          </label>
          <select
            id="activity-filter"
            value={filterActivity}
            onChange={(e) => setFilterActivity(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          >
            <option value="">{t.all_activities || 'All Activities'}</option>
            {Array.from(new Set(instructions.map((i) => i.activity)))
              .sort()
              .map((activity) => (
                <option key={activity} value={activity}>
                  {activity}
                </option>
              ))}
          </select>
        </div>
        <div className="sm:w-64">
          <label htmlFor="plant-category-filter" className="sr-only">
            Filter by plant category
          </label>
          <select
            id="plant-category-filter"
            value={filterPlantCategory}
            onChange={(e) => {
              setFilterPlantCategory(e.target.value);
              setFilterPlantUnit(''); // Reset unit filter when category changes
            }}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          >
            <option value="">All Plant Categories</option>
            {Array.from(new Set(plantUnits.map((unit) => unit.category)))
              .sort()
              .map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
          </select>
        </div>
        <div className="sm:w-64">
          <label htmlFor="plant-unit-filter" className="sr-only">
            Filter by plant unit
          </label>
          <select
            id="plant-unit-filter"
            value={filterPlantUnit}
            onChange={(e) => setFilterPlantUnit(e.target.value)}
            disabled={!filterPlantCategory}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">All Plant Units</option>
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

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <span className="ml-2 text-slate-600 dark:text-slate-400">
              Loading work instructions...
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <div className="text-red-600 dark:text-red-400 mb-2">
              <ExclamationTriangleIcon className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-slate-600 dark:text-slate-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <table
            className="min-w-full divide-y-4 divide-transparent"
            role="table"
            aria-label="Work Instructions Library"
          >
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                {tableHeaders.map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider"
                  >
                    {header !== 'actions' && header !== 'link' ? (
                      <button
                        onClick={() => handleSort(header)}
                        className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
                        aria-sort={
                          sortColumn === header
                            ? sortDirection === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none'
                        }
                        aria-label={`Sort by ${t[header]} ${sortColumn === header ? (sortDirection === 'asc' ? 'ascending' : 'descending') : ''}`}
                      >
                        {t[header]}
                        {sortColumn === header && (
                          <span className="text-slate-500" aria-hidden="true">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    ) : (
                      t[header]
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800">
              {groupedInstructions.map(([activity, instructionList], groupIndex) => (
                <React.Fragment key={activity}>
                  <motion.tr
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: groupIndex * 0.1 }}
                  >
                    <td
                      colSpan={tableHeaders.length}
                      className="px-6 py-3 bg-slate-100 dark:bg-slate-700"
                    >
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {activity}
                      </h3>
                    </td>
                  </motion.tr>
                  {instructionList.map((instruction, index) => (
                    <motion.tr
                      key={instruction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: groupIndex * 0.1 + index * 0.05 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 border-b border-slate-200 dark:border-slate-600"
                    >
                      {/* FIX: Use snake_case properties */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 font-mono">
                        {instruction.doc_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {instruction.doc_title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {instruction.plant_category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {instruction.plant_unit}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                        {instruction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a
                          href={instruction.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-800 hover:underline"
                        >
                          <LinkIcon className="w-4 h-4" />
                          <span>Open</span>
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <motion.button
                            onClick={() => handleOpenEditModal(instruction)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleOpenEditModal(instruction);
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                            aria-label={`Edit ${instruction.doc_title}`}
                            tabIndex={0}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          >
                            <EditIcon />
                          </motion.button>
                          <motion.button
                            onClick={() => handleOpenDeleteModal(instruction.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleOpenDeleteModal(instruction.id);
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                            aria-label={`Delete ${instruction.doc_title}`}
                            tabIndex={0}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          >
                            <TrashIcon />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </React.Fragment>
              ))}
              {groupedInstructions.length === 0 && (
                <tr>
                  <td
                    colSpan={tableHeaders.length}
                    className="text-center py-10 text-slate-500 dark:text-slate-400"
                  >
                    No work instructions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
        title={editingInstruction ? t.edit_instruction_title : t.add_instruction_title}
      >
        <WorkInstructionForm
          instructionToEdit={editingInstruction}
          onSave={handleSave}
          onCancel={handleCloseModals}
          t={t}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModals}
        title={t.delete_confirmation_title}
      >
        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t.delete_confirmation_message}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            onClick={handleDeleteConfirm}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            {t.confirm_delete_button}
          </button>
          <button
            onClick={handleCloseModals}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            {t.cancel_button}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default WorkInstructionLibraryPage;

