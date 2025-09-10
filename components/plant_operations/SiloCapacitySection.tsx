import React, { useState, useMemo, useEffect } from "react";
import { useSiloCapacities } from "../../hooks/useSiloCapacities";
import { usePagination } from "../../hooks/usePagination";
import Modal from "../../components/Modal";
import PlusIcon from "../../components/icons/PlusIcon";
import EditIcon from "../../components/icons/EditIcon";
import TrashIcon from "../../components/icons/TrashIcon";
import Pagination from "../../components/Pagination";
import SiloCapacityForm from "../../pages/plant_operations/SiloCapacityForm";
import { formatNumber } from "../../utils/formatters";

// Types
import { SiloCapacity } from "../../types";

interface SiloCapacitySectionProps {
  t: any;
  plantUnits: any[];
  onOpenDeleteModal: (id: string, type: string) => void;
}

const SiloCapacitySection: React.FC<SiloCapacitySectionProps> = ({
  t,
  plantUnits,
  onOpenDeleteModal,
}) => {
  const {
    records: siloCapacities,
    addRecord: addSilo,
    updateRecord: updateSilo,
  } = useSiloCapacities();
  const [editingSilo, setEditingSilo] = useState<SiloCapacity | null>(null);

  // Filter States
  const [siloCategoryFilter, setSiloCategoryFilter] = useState("");
  const [siloUnitFilter, setSiloUnitFilter] = useState("");

  // Derived data for filters
  const uniquePlantCategories = useMemo(
    () => [...new Set(plantUnits.map((unit) => unit.category).sort())],
    [plantUnits]
  );

  useEffect(() => {
    if (uniquePlantCategories.length > 0) {
      if (
        !siloCategoryFilter ||
        !uniquePlantCategories.includes(siloCategoryFilter)
      ) {
        setSiloCategoryFilter(uniquePlantCategories[0]);
      }
    }
  }, [uniquePlantCategories, siloCategoryFilter]);

  const unitsForSiloFilter = useMemo(() => {
    if (!siloCategoryFilter) return [];
    return plantUnits
      .filter((unit) => unit.category === siloCategoryFilter)
      .map((unit) => unit.unit)
      .sort();
  }, [plantUnits, siloCategoryFilter]);

  useEffect(() => {
    if (unitsForSiloFilter.length > 0) {
      if (!siloUnitFilter || !unitsForSiloFilter.includes(siloUnitFilter)) {
        setSiloUnitFilter(unitsForSiloFilter[0]);
      }
    } else {
      setSiloUnitFilter("");
    }
  }, [unitsForSiloFilter, siloUnitFilter]);

  const filteredSiloCapacities = useMemo(() => {
    if (!siloCategoryFilter || !siloUnitFilter) return [];
    return siloCapacities.filter(
      (silo) =>
        silo.plant_category === siloCategoryFilter &&
        silo.unit === siloUnitFilter
    );
  }, [siloCapacities, siloCategoryFilter, siloUnitFilter]);

  const {
    paginatedData: paginatedSilos,
    currentPage: silosCurrentPage,
    totalPages: silosTotalPages,
    setCurrentPage: setSilosCurrentPage,
  } = usePagination(filteredSiloCapacities, 10);

  // Modal State
  const [activeModal, setActiveModal] = useState(false);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingSilo(null);
    setActiveModal(true);
  };

  const handleOpenEditModal = (record: SiloCapacity) => {
    setEditingSilo(record);
    setActiveModal(true);
  };

  const handleCloseModal = () => {
    setActiveModal(false);
    setEditingSilo(null);
  };

  const handleSave = (record: any) => {
    "id" in record ? updateSilo(record) : addSilo(record);
    handleCloseModal();
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            {t.silo_capacity_title}
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label htmlFor="silo-cat-filter" className="sr-only">
                {t.plant_category}
              </label>
              <select
                id="silo-cat-filter"
                value={siloCategoryFilter}
                onChange={(e) => setSiloCategoryFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-red-500 focus:border-red-500 rounded-md"
              >
                {uniquePlantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="silo-unit-filter" className="sr-only">
                {t.unit}
              </label>
              <select
                id="silo-unit-filter"
                value={siloUnitFilter}
                onChange={(e) => setSiloUnitFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-red-500 focus:border-red-500 rounded-md"
                disabled={unitsForSiloFilter.length === 0}
              >
                {unitsForSiloFilter.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700"
            >
              <PlusIcon className="w-5 h-5" /> {t.add_data_button}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.plant_category}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.unit}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.silo_name}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.capacity}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.dead_stock}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.silo_lifestock}
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {paginatedSilos.map((silo) => {
                const lifestock = silo.capacity - silo.dead_stock;
                return (
                  <tr
                    key={silo.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {silo.plant_category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {silo.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                      {silo.silo_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {formatNumber(silo.capacity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {formatNumber(silo.dead_stock)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-200 font-semibold">
                      {formatNumber(lifestock)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(silo)}
                          className="p-2 text-slate-400 hover:text-red-600"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() =>
                            onOpenDeleteModal(silo.id, "siloCapacity")
                          }
                          className="p-2 text-slate-400 hover:text-red-600"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSiloCapacities.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No silo capacities match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={silosCurrentPage}
          totalPages={silosTotalPages}
          onPageChange={setSilosCurrentPage}
        />
      </div>

      {/* Modal */}
      <Modal
        isOpen={activeModal}
        onClose={handleCloseModal}
        title={editingSilo ? t.edit_silo_title : t.add_silo_title}
      >
        <SiloCapacityForm
          recordToEdit={editingSilo}
          onSave={handleSave}
          onCancel={handleCloseModal}
          t={t}
          plantUnits={plantUnits}
        />
      </Modal>
    </>
  );
};

export default SiloCapacitySection;
