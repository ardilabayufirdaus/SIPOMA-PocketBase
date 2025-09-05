import React, { useState, useCallback, useMemo } from 'react';
import { useWorkInstructions } from '../../hooks/useWorkInstructions';
import { WorkInstruction } from '../../types';
import Modal from '../../components/Modal';
import WorkInstructionForm from './WorkInstructionForm';
import PlusIcon from '../../components/icons/PlusIcon';
import EditIcon from '../../components/icons/EditIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import LinkIcon from '../../components/icons/LinkIcon';

const WorkInstructionLibraryPage: React.FC<{ t: any }> = ({ t }) => {
  const { instructions, addInstruction, updateInstruction, deleteInstruction } = useWorkInstructions();
  
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [editingInstruction, setEditingInstruction] = useState<WorkInstruction | null>(null);
  const [deletingInstructionId, setDeletingInstructionId] = useState<string | null>(null);

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

  const handleSave = useCallback((instruction: WorkInstruction | Omit<WorkInstruction, 'id'>) => {
    if ('id' in instruction) {
      updateInstruction(instruction as WorkInstruction);
    } else {
      addInstruction(instruction);
    }
    handleCloseModals();
  }, [addInstruction, updateInstruction, handleCloseModals]);
  
  const handleDeleteConfirm = useCallback(() => {
      if(deletingInstructionId) {
          deleteInstruction(deletingInstructionId);
      }
      handleCloseModals();
  }, [deletingInstructionId, deleteInstruction, handleCloseModals]);
  
  const groupedInstructions = useMemo(() => {
      const grouped = instructions.reduce((acc, instruction) => {
          const activity = instruction.activity;
          if (!acc[activity]) {
              acc[activity] = [];
          }
          acc[activity].push(instruction);
          return acc;
      }, {} as Record<string, WorkInstruction[]>);
      
      return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [instructions]);

  const tableHeaders = ['doc_code', 'doc_title', 'description', 'link', 'actions'];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800">{t.op_work_instruction_library}</h2>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-all duration-200"
        >
          <PlusIcon className="w-5 h-5"/>
          {t.add_data_button}
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y-4 divide-transparent">
          <thead className="bg-slate-50">
            <tr>
              {tableHeaders.map(header => (
                <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">{t[header]}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {groupedInstructions.map(([activity, instructionList]) => (
                <React.Fragment key={activity}>
                    <tr>
                        <td colSpan={tableHeaders.length} className="px-6 py-3 bg-slate-100">
                            <h3 className="text-sm font-bold text-slate-800">{activity}</h3>
                        </td>
                    </tr>
                    {instructionList.map((instruction) => (
                        <tr key={instruction.id} className="hover:bg-slate-50 transition-colors duration-150 border-b border-slate-200">
                            {/* FIX: Use snake_case properties */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{instruction.doc_code}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{instruction.doc_title}</td>
                            <td className="px-6 py-4 text-sm text-slate-500 max-w-sm">{instruction.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <a href={instruction.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-800 hover:underline">
                                    <LinkIcon className="w-4 h-4" />
                                    <span>Open</span>
                                </a>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                    <button onClick={() => handleOpenEditModal(instruction)} className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50"><EditIcon/></button>
                                    <button onClick={() => handleOpenDeleteModal(instruction.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50"><TrashIcon/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </React.Fragment>
            ))}
             {groupedInstructions.length === 0 && (
                <tr>
                    <td colSpan={tableHeaders.length} className="text-center py-10 text-slate-500">
                        No work instructions found.
                    </td>
                </tr>
             )}
          </tbody>
        </table>
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
            <p className="text-sm text-slate-600">{t.delete_confirmation_message}</p>
        </div>
        <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button onClick={handleDeleteConfirm} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm">
                {t.confirm_delete_button}
            </button>
            <button onClick={handleCloseModals} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                {t.cancel_button}
            </button>
        </div>
      </Modal>

    </div>
  );
};

export default WorkInstructionLibraryPage;
