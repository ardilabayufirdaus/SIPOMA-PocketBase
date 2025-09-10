import React, { useState } from "react";
import { usePicSettings } from "../../hooks/usePicSettings";
import { usePagination } from "../../hooks/usePagination";
import Modal from "../../components/Modal";
import PlusIcon from "../../components/icons/PlusIcon";
import EditIcon from "../../components/icons/EditIcon";
import TrashIcon from "../../components/icons/TrashIcon";
import Pagination from "../../components/Pagination";
import PicSettingForm from "../../pages/plant_operations/PicSettingForm";

// Types
import { PicSetting } from "../../types";

interface PicSettingSectionProps {
  t: any;
  onOpenDeleteModal: (id: string, type: string) => void;
}

const PicSettingSection: React.FC<PicSettingSectionProps> = ({
  t,
  onOpenDeleteModal,
}) => {
  // PIC Settings State
  const {
    records: picSettings,
    addRecord: addPicSetting,
    updateRecord: updatePicSetting,
    deleteRecord: deletePicSetting,
  } = usePicSettings();
  const [editingPic, setEditingPic] = useState<PicSetting | null>(null);
  const {
    paginatedData: paginatedPicSettings,
    currentPage: picCurrentPage,
    totalPages: picTotalPages,
    setCurrentPage: setPicCurrentPage,
  } = usePagination(picSettings, 10);

  // Modal State
  const [activeModal, setActiveModal] = useState(false);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingPic(null);
    setActiveModal(true);
  };

  const handleOpenEditModal = (record: PicSetting) => {
    setEditingPic(record);
    setActiveModal(true);
  };

  const handleCloseModal = () => {
    setActiveModal(false);
    setEditingPic(null);
  };

  const handleSave = (record: any) => {
    "id" in record ? updatePicSetting(record) : addPicSetting(record);
    handleCloseModal();
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            {t.pic_setting_title}
          </h2>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700"
          >
            <PlusIcon className="w-5 h-5" /> {t.add_data_button}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.pic}
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {paginatedPicSettings.map((pic) => (
                <tr
                  key={pic.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                    {pic.pic}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(pic)}
                        className="p-2 text-slate-400 hover:text-red-600"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => onOpenDeleteModal(pic.id, "picSetting")}
                        className="p-2 text-slate-400 hover:text-red-600"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={picCurrentPage}
          totalPages={picTotalPages}
          onPageChange={setPicCurrentPage}
        />
      </div>

      {/* Modal */}
      <Modal
        isOpen={activeModal}
        onClose={handleCloseModal}
        title={editingPic ? t.edit_pic_title : t.add_pic_title}
      >
        <PicSettingForm
          recordToEdit={editingPic}
          onSave={handleSave}
          onCancel={handleCloseModal}
          t={t}
        />
      </Modal>
    </>
  );
};

export default PicSettingSection;
