import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import ExcelJS, { CellValue } from 'exceljs';

// ...existing imports here...

// Component Definition
const CcrDataEntryPage: React.FC<{ t: Record<string, string> }> = ({ t }) => {
  // ...existing state and other variables here...

  // Parameter reorder state
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [modalParameterOrder, setModalParameterOrder] = useState<ParameterSetting[]>([]);

  // ...other code...

  // Filter parameters based on selected category and unit
  const filteredParameterSettings = useMemo(() => {
    // ...existing filter logic...
  }, [
    parameterSettings,
    selectedCategory,
    selectedUnit,
    plantUnits,
    pbParameterOrder,
    columnSearchQuery,
  ]);

  // Parameter reorder handlers - optimized for performance with debouncing
  const reorderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const moveParameterUp = useCallback((index: number) => {
    if (reorderTimeoutRef.current) return; // Prevent rapid clicks

    setModalParameterOrder((prev) => {
      if (index <= 0) return prev;
      const newOrder = [...prev];
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
      return newOrder;
    });

    // Debounce for 150ms to prevent rapid clicking
    reorderTimeoutRef.current = setTimeout(() => {
      reorderTimeoutRef.current = null;
    }, 150);
  }, []);

  const moveParameterDown = useCallback((index: number) => {
    if (reorderTimeoutRef.current) return; // Prevent rapid clicks

    setModalParameterOrder((prev) => {
      if (index >= prev.length - 1) return prev;
      const newOrder = [...prev];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      return newOrder;
    });

    // Debounce for 150ms to prevent rapid clicking
    reorderTimeoutRef.current = setTimeout(() => {
      reorderTimeoutRef.current = null;
    }, 150);
  }, []);
  
  // Handler for drag-and-drop reordering
  const handleParameterDragEnd = useCallback((result: DropResult) => {
    // If dropped outside of droppable area or no destination
    if (!result.destination) return;
    
    // If position didn't change
    if (result.source.index === result.destination.index) return;
    
    setModalParameterOrder((prev) => {
      const newOrder = Array.from(prev);
      const [movedItem] = newOrder.splice(result.source.index, 1);
      newOrder.splice(result.destination!.index, 0, movedItem);
      return newOrder;
    });
  }, []);

  useEffect(() => {
    if (showReorderModal) {
      setModalParameterOrder([...filteredParameterSettings]);
      
      // Add keyboard shortcut for quick reordering
      const handleKeyDown = (e: KeyboardEvent) => {
        // Find the currently focused element
        const focusedElement = document.activeElement;
        
        // Check if we're in the reorder modal context
        if (!focusedElement || !focusedElement.closest('.parameter-reorder-modal')) return;
        
        // Prevent keyboard shortcuts if we're in an input field
        if (focusedElement.tagName === 'INPUT' || focusedElement.tagName === 'TEXTAREA') return;
        
        // Get data attribute from closest draggable element
        const draggableElement = focusedElement.closest('[data-parameter-index]');
        if (!draggableElement) return;
        
        const index = parseInt(draggableElement.getAttribute('data-parameter-index') || '-1');
        if (index < 0) return;
        
        // Alt+ArrowUp - Move up
        if (e.altKey && e.key === 'ArrowUp') {
          e.preventDefault();
          moveParameterUp(index);
        }
        
        // Alt+ArrowDown - Move down
        if (e.altKey && e.key === 'ArrowDown') {
          e.preventDefault();
          moveParameterDown(index);
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showReorderModal, filteredParameterSettings, moveParameterUp, moveParameterDown]);

  // Memoized parameter reorder item component for better performance
  const ParameterReorderItem = React.memo(
    ({ param, index }: { param: ParameterSetting; index: number }) => (
      <Draggable draggableId={param.id} index={index} key={param.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            data-parameter-index={index}
            className={`flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg ${
              snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400 dark:ring-blue-600' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                {...provided.dragHandleProps}
                className="flex items-center gap-1 cursor-grab active:cursor-grabbing"
              >
                <svg 
                  className="w-4 h-4 text-slate-400" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M8 6H6V8H8V6Z M8 11H6V13H8V11Z M8 16H6V18H8V16Z M18 6H16V8H18V6Z M18 11H16V13H18V11Z M18 16H16V18H18V16Z M13 6H11V8H13V6Z M13 11H11V13H13V11Z M13 16H11V18H13V16Z" 
                    fill="currentColor"
                  />
                </svg>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {index + 1}.
                </span>
              </div>
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {param.parameter}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{param.unit}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <EnhancedButton
                variant="ghost"
                size="xs"
                onClick={() => moveParameterUp(index)}
                disabled={index === 0}
                aria-label={`Move ${param.parameter} up`}
              >
                ↑
              </EnhancedButton>
              <EnhancedButton
                variant="ghost"
                size="xs"
                onClick={() => moveParameterDown(index)}
                disabled={index === modalParameterOrder.length - 1}
                aria-label={`Move ${param.parameter} down`}
              >
                ↓
              </EnhancedButton>
            </div>
          </div>
        )}
      </Draggable>
    )
  );
  ParameterReorderItem.displayName = 'ParameterReorderItem';

  // ...other code and components...

  return (
    // ...other JSX...
  
      {/* Parameter Reorder Modal */}
      <Modal
        isOpen={showReorderModal}
        onClose={() => setShowReorderModal(false)}
        title="Reorder Parameters"
      >
        <div className="space-y-4 parameter-reorder-modal">
          <div className="space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Drag parameters untuk menyusun ulang dengan cepat atau gunakan tombol ↑/↓ untuk penyesuaian halus.
              Urutan akan disimpan secara otomatis.
            </p>
            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-md">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Pintasan Keyboard:
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pl-4 list-disc">
                <li>Alt + ↑ : Pindahkan parameter ke atas</li>
                <li>Alt + ↓ : Pindahkan parameter ke bawah</li>
              </ul>
            </div>
          </div>

          <DragDropContext onDragEnd={handleParameterDragEnd}>
            <Droppable droppableId="parameter-reorder-list">
              {(provided) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps} 
                  className="max-h-96 overflow-y-auto space-y-2"
                >
                  {modalParameterOrder.map((param, index) => (
                    <ParameterReorderItem key={param.id} param={param} index={index} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <EnhancedButton
              variant="outline"
              onClick={() => setShowLoadProfileModal(true)}
              aria-label="Load profile"
            >
              Load Profile
            </EnhancedButton>
            <EnhancedButton
              variant="outline"
              onClick={() => setShowSaveProfileModal(true)}
              aria-label="Save profile"
            >
              Save Profile
            </EnhancedButton>
            <EnhancedButton
              variant="outline"
              onClick={() => {
                // Reset to default order (sorted by parameter name)
                const defaultOrder = [...filteredParameterSettings].sort((a, b) =>
                  a.parameter.localeCompare(b.parameter)
                );
                setModalParameterOrder(defaultOrder);
              }}
              aria-label="Reset to default order"
            >
              Reset to Default
            </EnhancedButton>
            <EnhancedButton
              variant="primary"
              onClick={() => {
                const newOrder = modalParameterOrder.map((param) => param.id);
                setPbParameterOrder(newOrder);
                saveParameterOrder(newOrder);
                setShowReorderModal(false);
              }}
              aria-label="Save parameter order"
            >
              Done
            </EnhancedButton>
          </div>
        </div>
      </Modal>
    
    // ...other JSX...
  );
};

export default CcrDataEntryPage;