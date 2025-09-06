import React, { useState, useCallback } from "react";
import { usePackingPlantMasterData } from "../../hooks/usePackingPlantMasterData";
import { PackingPlantMasterRecord } from "../../types";
import Modal from "../../components/Modal";
import PackingPlantDataForm from "./PackingPlantDataForm";
import PlusIcon from "../../components/icons/PlusIcon";
import EditIcon from "../../components/icons/EditIcon";
import TrashIcon from "../../components/icons/TrashIcon";
import { formatNumber } from "../../utils/formatters";

const PackingPlantMasterData: React.FC<{ t: any }> = ({ t }) => {
  const { records, addRecord, updateRecord, deleteRecord } =
    usePackingPlantMasterData();

  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const [editingRecord, setEditingRecord] =
    useState<PackingPlantMasterRecord | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);

  const handleOpenAddModal = useCallback(() => {
    setEditingRecord(null);
    setFormModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback(
    (record: PackingPlantMasterRecord) => {
      setEditingRecord(record);
      setFormModalOpen(true);
    },
    []
  );

  const handleOpenDeleteModal = (recordId: string) => {
    setDeletingRecordId(recordId);
    setDeleteModalOpen(true);
  };

  const handleCloseModals = useCallback(() => {
    setFormModalOpen(false);
    setDeleteModalOpen(false);
    setEditingRecord(null);
    setDeletingRecordId(null);
  }, []);

  const handleSave = useCallback(
    (
      record: PackingPlantMasterRecord | Omit<PackingPlantMasterRecord, "id">
    ) => {
      if ("id" in record) {
        updateRecord(record as PackingPlantMasterRecord);
      } else {
        addRecord(record);
      }
      handleCloseModals();
    },
    [addRecord, updateRecord, handleCloseModals]
  );

  const handleDeleteConfirm = useCallback(() => {
    if (deletingRecordId) {
      deleteRecord(deletingRecordId);
    }
    handleCloseModals();
  }, [deletingRecordId, deleteRecord, handleCloseModals]);

  const tableHeaders = [
    "area",
    "plant_code",
    "silo_capacity",
    "dead_stock",
    "live_stock",
    "cement_type",
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            {t.pack_master_data}
          </h2>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-all duration-200"
          >
            <PlusIcon className="w-5 h-5" />
            {t.add_data_button}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                {tableHeaders.map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider"
                  >
                    {t[header]}
                  </th>
                ))}
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {records.map((record) => {
                const liveStock = record.silo_capacity - record.dead_stock;
                return (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-200">
                      {record.area}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 font-mono">
                      {record.plant_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {formatNumber(record.silo_capacity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {formatNumber(record.dead_stock)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-200 font-semibold">
                      {formatNumber(liveStock)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {record.cement_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(record)}
                          className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all duration-150"
                          aria-label={`Edit ${record.plant_code}`}
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(record.id)}
                          className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all duration-150"
                          aria-label={`Delete ${record.plant_code}`}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Modal
          isOpen={isFormModalOpen}
          onClose={handleCloseModals}
          title={
            editingRecord ? t.edit_master_data_title : t.add_master_data_title
          }
        >
          <PackingPlantDataForm
            recordToEdit={editingRecord}
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
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-150"
            >
              {t.confirm_delete_button}
            </button>
            <button
              onClick={handleCloseModals}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-150"
            >
              {t.cancel_button}
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default PackingPlantMasterData;
