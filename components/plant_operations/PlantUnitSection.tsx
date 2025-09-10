import React, { useState } from "react";
import { usePlantUnits } from "../../hooks/usePlantUnits";
import { usePagination } from "../../hooks/usePagination";
import Modal from "../../components/Modal";
import PlusIcon from "../../components/icons/PlusIcon";
import EditIcon from "../../components/icons/EditIcon";
import TrashIcon from "../../components/icons/TrashIcon";
import Pagination from "../../components/Pagination";
import PlantUnitForm from "../../pages/plant_operations/PlantUnitForm";

// Types
import { PlantUnit } from "../../types";

interface PlantUnitSectionProps {
  t: any;
  onOpenDeleteModal: (id: string, type: string) => void;
}

const PlantUnitSection: React.FC<PlantUnitSectionProps> = ({
  t,
  onOpenDeleteModal,
}) => {
  // Plant Units State
  const {
    records: plantUnits,
    addRecord: addPlantUnit,
    updateRecord: updatePlantUnit,
    deleteRecord: deletePlantUnit,
  } = usePlantUnits();
  const [editingPlantUnit, setEditingPlantUnit] = useState<PlantUnit | null>(
    null
  );
  const {
    paginatedData: paginatedPlantUnits,
    currentPage: puCurrentPage,
    totalPages: puTotalPages,
    setCurrentPage: setPuCurrentPage,
  } = usePagination(plantUnits, 10);

  // Modal State
  const [activeModal, setActiveModal] = useState(false);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingPlantUnit(null);
    setActiveModal(true);
  };

  const handleOpenEditModal = (record: PlantUnit) => {
    setEditingPlantUnit(record);
    setActiveModal(true);
  };

  const handleCloseModal = () => {
    setActiveModal(false);
    setEditingPlantUnit(null);
  };

  const handleSave = (record: any) => {
    "id" in record ? updatePlantUnit(record) : addPlantUnit(record);
    handleCloseModal();
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            {t.plant_unit_title}
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
                  {t.unit}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.plant_category}
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {paginatedPlantUnits.map((unit) => (
                <tr
                  key={unit.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                    {unit.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {unit.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(unit)}
                        className="p-2 text-slate-400 hover:text-red-600"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => onOpenDeleteModal(unit.id, "plantUnit")}
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
          currentPage={puCurrentPage}
          totalPages={puTotalPages}
          onPageChange={setPuCurrentPage}
        />
      </div>

      {/* Modal */}
      <Modal
        isOpen={activeModal}
        onClose={handleCloseModal}
        title={
          editingPlantUnit ? t.edit_plant_unit_title : t.add_plant_unit_title
        }
      >
        <PlantUnitForm
          recordToEdit={editingPlantUnit}
          onSave={handleSave}
          onCancel={handleCloseModal}
          t={t}
        />
      </Modal>
    </>
  );
};

export default PlantUnitSection;
