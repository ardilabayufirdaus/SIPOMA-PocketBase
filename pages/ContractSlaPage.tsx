import React, { useState, useMemo } from 'react';
import { useContractsData, EnrichedContract } from '../hooks/useContractsData';
import { ContractFilterState, ContractSLA } from '../types';
import ContractStatsHeader from '../components/contracts/ContractStatsHeader';
import ContractH90AlertBanner from '../components/contracts/ContractH90AlertBanner';
import ContractFilterBar from '../components/contracts/ContractFilterBar';
import ContractCard from '../components/contracts/ContractCard';
import ContractTableView from '../components/contracts/ContractTableView';
import ContractFormModal from '../components/contracts/ContractFormModal';
import ContractDetailModal from '../components/contracts/ContractDetailModal';
import SapScreenshotModal from '../components/contracts/SapScreenshotModal';
import PdfViewerModal from '../components/contracts/PdfViewerModal';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { usePermissions } from '../utils/permissions';
import { useTranslation } from '../hooks/useTranslation';
import { exportContractsToExcel } from '../utils/exportContractExcel';
import DocumentTextIcon from '../components/icons/DocumentTextIcon';
import PlusIcon from '../components/icons/PlusIcon';
import ArrowPathRoundedSquareIcon from '../components/icons/ArrowPathRoundedSquareIcon';
import RealtimeIndicator from '../components/ui/RealtimeIndicator';

const CATEGORIES = [
  'Raw Material',
  'Maintenance & Sparepart',
  'Logistik & Transport',
  'Outsourcing & Jasa',
  'Konstruksi & Proyek',
  'Chemical & Consumable',
  'Lain-lain',
];

export const ContractSlaPage: React.FC = () => {
  const { t, language } = useTranslation();
  const { currentUser } = useCurrentUser();
  const permissionChecker = usePermissions(currentUser);
  const canWrite = permissionChecker.hasPermission('contract_sla_management', 'WRITE');

  const {
    contracts,
    loading,
    error,
    stats,
    filterContracts,
    getFileUrl,
    createContract,
    updateContract,
    deleteContract,
    updateRealization,
    refetch,
  } = useContractsData();

  // Filter & View States
  const [filterState, setFilterState] = useState<ContractFilterState>({
    search: '',
    category: 'all',
    status: 'all',
    currency: 'all',
    expiryFilter: 'all',
    sortBy: 'created_desc',
  });

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractSLA | null>(null);
  const [detailContract, setDetailContract] = useState<EnrichedContract | null>(null);

  const [sapModal, setSapModal] = useState<{
    isOpen: boolean;
    url: string;
    po: string;
    title: string;
  }>({
    isOpen: false,
    url: '',
    po: '',
    title: '',
  });

  const [pdfModal, setPdfModal] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
  }>({
    isOpen: false,
    url: '',
    title: '',
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    contract: EnrichedContract | null;
  }>({
    isOpen: false,
    contract: null,
  });

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && deleteModal.isOpen) {
        setDeleteModal({ isOpen: false, contract: null });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteModal.isOpen]);

  // Filtered contracts
  const filteredContracts = useMemo(
    () => filterContracts(filterState),
    [filterContracts, filterState]
  );

  const handleFilterUpdate = (updates: Partial<ContractFilterState>) => {
    setFilterState((prev) => ({ ...prev, ...updates }));
  };

  // Handlers for action buttons
  const handleOpenAddModal = () => {
    if (!canWrite) return;
    setEditingContract(null);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (contract: EnrichedContract) => {
    if (!canWrite) return;
    setEditingContract(contract);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData: FormData) => {
    if (!canWrite) {
      alert('Anda tidak memiliki izin WRITE untuk mengubah data kontrak.');
      return;
    }
    if (editingContract?.id) {
      await updateContract(editingContract.id, formData);
    } else {
      await createContract(formData);
    }
  };

  const handleConfirmDelete = async () => {
    if (!canWrite) {
      alert('Anda tidak memiliki izin WRITE untuk menghapus data kontrak.');
      return;
    }
    if (deleteModal.contract?.id) {
      await deleteContract(deleteModal.contract.id);
      setDeleteModal({ isOpen: false, contract: null });
      if (detailContract?.id === deleteModal.contract.id) {
        setDetailContract(null);
      }
    }
  };

  // Export to Excel with rich styling, borders, and KPI summary
  const handleExportExcel = async () => {
    if (filteredContracts.length === 0) return;

    // Build filter summary string
    const filterParts: string[] = [];
    if (filterState.category !== 'all') {
      filterParts.push(`Kategori: ${filterState.category}`);
    }
    if (filterState.expiryFilter !== 'all') {
      filterParts.push(`Status: ${filterState.expiryFilter.toUpperCase()}`);
    }
    if (filterState.search) {
      filterParts.push(`Pencarian: "${filterState.search}"`);
    }
    const filterDesc =
      filterParts.length > 0
        ? filterParts.join(' | ')
        : language === 'en'
          ? 'All Contracts'
          : 'Semua Kontrak';

    await exportContractsToExcel({
      contracts: filteredContracts,
      stats,
      language,
      userName: currentUser?.name || currentUser?.username || 'Admin SIPOMA',
      activeFilterSummary: filterDesc,
    });
  };

  return (
    <div className="w-full space-y-4 sm:space-y-5 font-sans">
      {/* Hero Header Section - 20 Aturan Wajib */}
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary-900 via-slate-900 to-secondary-950 rounded-xl shadow-md border border-slate-800 p-4 sm:p-5 text-white w-full">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <DocumentTextIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Procurement & Legal
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 rounded-full">
                  Contract & SLA
                </span>
                <RealtimeIndicator isConnected={true} lastUpdate={new Date()} />
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white font-display">
                {t.contract_sla_title || 'Contract & SLA Management'}
              </h1>
              <p className="text-xs text-slate-300 font-normal mt-0.5">
                {t.contract_sla_sub ||
                  'Monitoring purchase order SAP, masa berlaku H-90, anggaran & serapan volume, dan arsip dokumen.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg text-xs font-semibold shadow-xs transition-all min-h-[36px]"
              title="Refresh Data Kontrak"
            >
              <ArrowPathRoundedSquareIcon
                className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`}
              />
              <span>Refresh</span>
            </button>
            {canWrite && (
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg shadow-xs transition-all min-h-[36px]"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Tambah Kontrak</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Cards Header */}
      <ContractStatsHeader
        stats={stats}
        activeFilter={filterState.expiryFilter}
        onFilterAllClick={() => handleFilterUpdate({ expiryFilter: 'all' })}
        onFilterH90Click={() => handleFilterUpdate({ expiryFilter: 'h90' })}
        onFilterExpiredClick={() => handleFilterUpdate({ expiryFilter: 'expired' })}
        t={t}
      />

      {/* Dynamic H-90 Warning Banner */}
      <ContractH90AlertBanner
        contracts={contracts}
        onSelectContract={(c) => setDetailContract(c)}
        onFilterH90={() => handleFilterUpdate({ expiryFilter: 'h90' })}
        t={t}
      />

      {/* Filter and Action Bar */}
      <ContractFilterBar
        filterState={filterState}
        onFilterChange={handleFilterUpdate}
        categories={CATEGORIES}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddClick={handleOpenAddModal}
        onExportClick={handleExportExcel}
        totalFilteredCount={filteredContracts.length}
        canWrite={canWrite}
        t={t}
      />

      {/* Content View: Loading, Grid Cards, or Table */}
      {loading && contracts.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-64 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-center">
          <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{error}</p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Coba Lagi
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <ContractTableView
          contracts={filteredContracts}
          onViewDetail={(c) => setDetailContract(c)}
          onEdit={handleOpenEditModal}
          onDelete={(c) => setDeleteModal({ isOpen: true, contract: c })}
          onViewPdf={(url, title) => setPdfModal({ isOpen: true, url, title })}
          onViewSapScreenshot={(url, po, title) => setSapModal({ isOpen: true, url, po, title })}
          getFileUrl={getFileUrl}
          canEdit={canWrite}
          t={t}
          language={language}
        />
      ) : filteredContracts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredContracts.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              onViewDetail={(c) => setDetailContract(c)}
              onEdit={handleOpenEditModal}
              onDelete={(c) => setDeleteModal({ isOpen: true, contract: c })}
              onViewPdf={(url, title) => setPdfModal({ isOpen: true, url, title })}
              onViewSapScreenshot={(url, po, title) =>
                setSapModal({ isOpen: true, url, po, title })
              }
              getFileUrl={getFileUrl}
              canEdit={canWrite}
              t={t}
              language={language}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {t.no_contracts_found || 'Tidak ada kontrak yang sesuai dengan filter'}
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            {t.no_contracts_desc ||
              'Silakan ubah kata kunci pencarian atau reset filter untuk melihat data lainnya.'}
          </p>
          <button
            onClick={() =>
              setFilterState({
                search: '',
                category: 'all',
                status: 'all',
                expiryFilter: 'all',
                sortBy: 'created_desc',
              })
            }
            className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
          >
            {t.reset_filters || 'Reset Semua Filter'}
          </button>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Add / Edit Form Modal */}
      <ContractFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingContract}
        categories={CATEGORIES}
        t={t}
      />

      {/* 2. Detail & Realization Modal */}
      <ContractDetailModal
        isOpen={!!detailContract}
        onClose={() => setDetailContract(null)}
        contract={detailContract}
        onEdit={handleOpenEditModal}
        onDelete={(c) => setDeleteModal({ isOpen: true, contract: c })}
        onUpdateRealization={updateRealization}
        onViewPdf={(url, title) => setPdfModal({ isOpen: true, url, title })}
        onViewSapScreenshot={(url, po, title) => setSapModal({ isOpen: true, url, po, title })}
        getFileUrl={getFileUrl}
        canEdit={canWrite}
        t={t}
        language={language}
      />

      {/* 3. SAP Screenshot Lightbox Modal */}
      <SapScreenshotModal
        isOpen={sapModal.isOpen}
        onClose={() => setSapModal((prev) => ({ ...prev, isOpen: false }))}
        imageUrl={sapModal.url}
        poNumber={sapModal.po}
        contractTitle={sapModal.title}
        t={t}
      />

      {/* 4. PDF Viewer Modal */}
      <PdfViewerModal
        isOpen={pdfModal.isOpen}
        onClose={() => setPdfModal((prev) => ({ ...prev, isOpen: false }))}
        pdfUrl={pdfModal.url}
        title={pdfModal.title}
        t={t}
      />

      {/* 5. Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.contract && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setDeleteModal({ isOpen: false, contract: null })}
          />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              {t.delete_confirm_title || 'Hapus Data Kontrak?'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t.delete_confirm_desc ||
                'Anda yakin ingin menghapus data kontrak ini? Tindakan ini tidak dapat dibatalkan.'}{' '}
              (<strong>{deleteModal.contract.po_number}</strong> -{' '}
              {deleteModal.contract.contract_title})
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setDeleteModal({ isOpen: false, contract: null })}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                {t.cancel || 'Batal'}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20"
              >
                {t.delete_now || 'Hapus Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractSlaPage;
