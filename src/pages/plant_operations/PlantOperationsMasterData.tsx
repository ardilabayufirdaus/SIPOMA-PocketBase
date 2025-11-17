import React, { useState, useEffect } from 'react';
import { useCopFooterParametersRecords } from '@/hooks/useCopFooterParametersRecords';
import { usePlantCategories } from '@/hooks/usePlantCategories';
import { usePlantUnits } from '@/hooks/usePlantUnits';
import { useCopParameters } from '@/hooks/useCopParameters';
import Modal from '@/components/Modal';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { logger } from '@/utils/logger';

interface PlantOperationsMasterDataProps {
  // Add props if needed
}

const PlantOperationsMasterData: React.FC<PlantOperationsMasterDataProps> = () => {
  const { records: footerParams, loading: footerLoading } = useCopFooterParametersRecords();

  const { data: categories } = usePlantCategories();
  const { records: units } = usePlantUnits();
  const { copParameterIds: copParams } = useCopParameters();

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [selectedParameterIds, setSelectedParameterIds] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtered data
  const filteredData = footerParams.filter((item) => {
    const categoryMatch = !selectedCategory || item.plant_category === selectedCategory;
    const unitMatch = !selectedUnit || item.plant_unit === selectedUnit;
    return categoryMatch && unitMatch;
  });

  // Paginated data
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleCreate = () => {
    setEditingRecord(null);
    setSelectedParameterIds([]);
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setSelectedParameterIds(record.parameter_ids || []);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        // await deleteRecord(id);
        logger.info('COP Footer parameter delete not implemented');
      } catch (error) {
        logger.error('Failed to delete COP Footer parameter:', error);
      }
    }
  };

  const handleSave = async () => {
    console.log('handleSave called with:', {
      selectedCategory,
      selectedUnit,
      selectedParameterIds,
      editingRecord: editingRecord?.id,
    });

    if (!selectedCategory || !selectedUnit) {
      alert('Please select both plant category and unit');
      return;
    }

    if (selectedParameterIds.length === 0) {
      alert('Please select at least one parameter');
      return;
    }

    try {
      const data = {
        plant_category: selectedCategory,
        plant_unit: selectedUnit,
        parameter_ids: selectedParameterIds,
      };

      console.log('Data to send to PocketBase:', data);

      if (editingRecord) {
        console.log('Updating record:', editingRecord.id);
        // await updateRecord(editingRecord.id, data);
        logger.info('COP Footer parameter update not implemented');
      } else {
        console.log('Creating new record');
        // await createRecord(data);
        logger.info('COP Footer parameter create not implemented');
      }

      setIsModalOpen(false);
      setEditingRecord(null);
      setSelectedParameterIds([]);
    } catch (error) {
      console.error('Failed to save COP Footer parameter:', error);
      alert(`Failed to save record: ${error.message || 'Unknown error'}`);
    }
  };

  const handleParameterToggle = (paramId: string) => {
    setSelectedParameterIds((prev) =>
      prev.includes(paramId) ? prev.filter((id) => id !== paramId) : [...prev, paramId]
    );
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedUnit]);

  if (footerLoading) {
    return <LoadingSkeleton />;
  }

  // if (footerError) {
  //   return (
  //     <div className="p-4 text-red-600 bg-red-50 rounded-lg">
  //       Error loading COP Footer Parameters: {footerError}
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">COP Parameters Footer</h2>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Footer Parameter
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Plant Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Plant Unit
          </label>
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">All Units</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.unit}>
                {unit.unit}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Plant Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Plant Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Parameters Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedData.map((item) => {
                let paramCount = 0;
                paramCount = item.parameter_ids?.length || 0;

                return (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.plant_category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.plant_unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {paramCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(item.created).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}{' '}
              results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecord ? 'Edit COP Footer Parameter' : 'Add COP Footer Parameter'}
      >
        <div className="space-y-4">
          {/* Plant Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Plant Category *
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              required
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Plant Unit Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Plant Unit *
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              required
            >
              <option value="">Select Unit</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.unit}>
                  {unit.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Parameter Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              COP Parameters
            </label>
            <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2 dark:border-gray-600">
              {copParams.map((param) => (
                <label key={param} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={selectedParameterIds.includes(param)}
                    onChange={() => handleParameterToggle(param)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{param}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Selected: {selectedParameterIds.length} parameters
            </p>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingRecord ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PlantOperationsMasterData;
