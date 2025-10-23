import React, { useState } from 'react';
import { Page } from '../App';
import ClipboardCheckIcon from '../components/icons/ClipboardCheckIcon';
import { EnhancedCard, EnhancedButton } from '../components/ui/EnhancedComponents';

// Types
type InspectionTab = 'general' | 'hose-valve-blasting-mbf' | 'safety' | 'documentation';

interface TabConfig {
  id: InspectionTab;
  label: {
    en: string;
    id: string;
  };
  icon: string;
}

interface TabComponentProps {
  language: 'en' | 'id';
}

// Types for Hopper data
interface HopperRowData {
  urutan: number;
  valve1: string;
  status1: string;
  ket1: string;
  valve2: string;
  status2: string;
  ket2: string;
}

interface HoseValveFormData {
  title: string;
  date: string;
  shift: string;
  hoppers: {
    [key: string]: HopperRowData[];
  };
  status: string;
  tender: string;
  cpPersonil: string;
  notes: string;
}

// Tab Components
const HoseValveBlastingMBFTab: React.FC<TabComponentProps> = ({ language }) => {
  const [formData, setFormData] = useState<HoseValveFormData>({
    title:
      language === 'en'
        ? 'Hose & Valve Blasting MBF Inspection Form'
        : 'Formulir Inspeksi Hose & Valve Blasting MBF',
    date: new Date().toISOString().split('T')[0],
    shift: '',
    hoppers: {
      'HOPPER 1': (() => {
        const valve1Numbers = [
          4, 10, 16, 22, 5, 11, 17, 23, 6, 12, 18, 1, 7, 13, 19, 2, 8, 14, 20, 3, 9, 15, 21,
        ];
        const valve2Numbers = [
          27,
          33,
          39,
          45,
          28,
          34,
          40,
          '-',
          29,
          35,
          41,
          24,
          30,
          36,
          42,
          25,
          31,
          37,
          43,
          26,
          32,
          38,
          44,
        ];
        return Array.from({ length: 23 }, (_, i) => ({
          urutan: i + 1,
          valve1: valve1Numbers[i].toString(),
          status1: '',
          ket1: '',
          valve2: valve2Numbers[i].toString(),
          status2: '',
          ket2: '',
        }));
      })(),
      'HOPPER 2': (() => {
        const valve1Numbers = [
          4, 10, 16, 22, 5, 11, 17, 23, 6, 12, 18, 1, 7, 13, 19, 2, 8, 14, 20, 3, 9, 15, 21,
        ];
        const valve2Numbers = [
          27,
          33,
          39,
          45,
          28,
          34,
          40,
          '-',
          29,
          35,
          41,
          24,
          30,
          36,
          42,
          25,
          31,
          37,
          43,
          26,
          32,
          38,
          44,
        ];
        return Array.from({ length: 23 }, (_, i) => ({
          urutan: i + 1,
          valve1: valve1Numbers[i].toString(),
          status1: '',
          ket1: '',
          valve2: valve2Numbers[i].toString(),
          status2: '',
          ket2: '',
        }));
      })(),
      'HOPPER 3': (() => {
        const valve1Numbers = [
          4, 10, 16, 22, 5, 11, 17, 23, 6, 12, 18, 1, 7, 13, 19, 2, 8, 14, 20, 3, 9, 15, 21,
        ];
        const valve2Numbers = [
          27,
          33,
          39,
          45,
          28,
          34,
          40,
          '-',
          29,
          35,
          41,
          24,
          30,
          36,
          42,
          25,
          31,
          37,
          43,
          26,
          32,
          38,
          44,
        ];
        return Array.from({ length: 23 }, (_, i) => ({
          urutan: i + 1,
          valve1: valve1Numbers[i].toString(),
          status1: '',
          ket1: '',
          valve2: valve2Numbers[i].toString(),
          status2: '',
          ket2: '',
        }));
      })(),
      'HOPPER 4': (() => {
        const valve1Numbers = [
          4, 10, 16, 22, 5, 11, 17, 23, 6, 12, 18, 1, 7, 13, 19, 2, 8, 14, 20, 3, 9, 15, 21,
        ];
        const valve2Numbers = [
          27,
          33,
          39,
          45,
          28,
          34,
          40,
          '-',
          29,
          35,
          41,
          24,
          30,
          36,
          42,
          25,
          31,
          37,
          43,
          26,
          32,
          38,
          44,
        ];
        return Array.from({ length: 23 }, (_, i) => ({
          urutan: i + 1,
          valve1: valve1Numbers[i].toString(),
          status1: '',
          ket1: '',
          valve2: valve2Numbers[i].toString(),
          status2: '',
          ket2: '',
        }));
      })(),
    },
    status: '',
    tender: '',
    cpPersonil: '',
    notes: '',
  });

  const handleInputChange = (field: keyof HoseValveFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleHopperDataChange = (
    hopperName: string,
    rowIndex: number,
    field: keyof HopperRowData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      hoppers: {
        ...prev.hoppers,
        [hopperName]: prev.hoppers[hopperName].map((row, index) =>
          index === rowIndex ? { ...row, [field]: value } : row
        ),
      },
    }));
  };

  const handleSaveInspection = () => {
    alert(language === 'en' ? 'Inspection data saved!' : 'Data inspeksi disimpan!');
  };

  const renderHopperTable = (hopperName: string) => (
    <div
      key={hopperName}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Hopper Header */}
      <div className="bg-primary-600 text-white px-4 py-3">
        <h3 className="text-lg font-semibold text-center">{hopperName}</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-3 text-left font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600">
                {language === 'en' ? 'Order' : 'Urutan'}
              </th>
              <th className="px-3 py-3 text-left font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600">
                Valve
              </th>
              <th className="px-3 py-3 text-left font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600">
                Status
              </th>
              <th className="px-3 py-3 text-left font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600">
                Ket
              </th>
              <th className="px-3 py-3 text-left font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600">
                Valve
              </th>
              <th className="px-3 py-3 text-left font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600">
                Status
              </th>
              <th className="px-3 py-3 text-left font-medium text-gray-900 dark:text-white">Ket</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {formData.hoppers[hopperName].map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-3 py-2 text-center font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600">
                  {row.urutan}
                </td>
                <td className="px-3 py-2 border-r border-gray-200 dark:border-gray-600">
                  <input
                    type="text"
                    value={row.valve1}
                    onChange={(e) =>
                      handleHopperDataChange(hopperName, index, 'valve1', e.target.value)
                    }
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    placeholder={language === 'en' ? 'No...' : 'No...'}
                  />
                </td>
                <td className="px-3 py-2 border-r border-gray-200 dark:border-gray-600">
                  <select
                    value={row.status1}
                    onChange={(e) =>
                      handleHopperDataChange(hopperName, index, 'status1', e.target.value)
                    }
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  >
                    <option value="">-</option>
                    <option value="OK">OK</option>
                    <option value="NOT">NOT</option>
                  </select>
                </td>
                <td className="px-3 py-2 border-r border-gray-200 dark:border-gray-600">
                  <input
                    type="text"
                    value={row.ket1}
                    onChange={(e) =>
                      handleHopperDataChange(hopperName, index, 'ket1', e.target.value)
                    }
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    placeholder={language === 'en' ? 'Notes...' : 'Catatan...'}
                  />
                </td>
                <td className="px-3 py-2 border-r border-gray-200 dark:border-gray-600">
                  <input
                    type="text"
                    value={row.valve2}
                    onChange={(e) =>
                      handleHopperDataChange(hopperName, index, 'valve2', e.target.value)
                    }
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    placeholder={language === 'en' ? 'No...' : 'No...'}
                  />
                </td>
                <td className="px-3 py-2 border-r border-gray-200 dark:border-gray-600">
                  <select
                    value={row.status2}
                    onChange={(e) =>
                      handleHopperDataChange(hopperName, index, 'status2', e.target.value)
                    }
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  >
                    <option value="">-</option>
                    <option value="OK">OK</option>
                    <option value="NOT">NOT</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.ket2}
                    onChange={(e) =>
                      handleHopperDataChange(hopperName, index, 'ket2', e.target.value)
                    }
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    placeholder={language === 'en' ? 'Notes...' : 'Catatan...'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-full">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'en' ? 'Form Title' : 'Judul Formulir'}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'en' ? 'Date' : 'Tanggal'}
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Shift
            </label>
            <select
              value={formData.shift}
              onChange={(e) => handleInputChange('shift', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">{language === 'en' ? 'Select Shift' : 'Pilih Shift'}</option>
              <option value="1">Shift 1 (07:00 - 15:00)</option>
              <option value="2">Shift 2 (15:00 - 23:00)</option>
              <option value="3">Shift 3 (23:00 - 07:00)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hopper Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {Object.keys(formData.hoppers).map((hopperName) => renderHopperTable(hopperName))}
      </div>

      {/* Bottom Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tender
            </label>
            <input
              type="text"
              value={formData.tender}
              onChange={(e) => handleInputChange('tender', e.target.value)}
              placeholder={language === 'en' ? 'Enter tender name' : 'Masukkan nama tender'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              CP Personil EPDC
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
              <div className="text-sm text-gray-900 dark:text-white space-y-1">
                <div>Uppy (0895-1432-3785)</div>
                <div>Sulham (0811-4608-805)</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {language === 'en' ? 'Notes' : 'Catatan'}
          </label>
          <div className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
            <div className="text-sm text-gray-900 dark:text-white space-y-3">
              <div>
                <strong>
                  {language === 'en'
                    ? 'Blasting Process Information:'
                    : 'Informasi Proses Blasting:'}
                </strong>
              </div>
              <div>
                {language === 'en'
                  ? 'In one blasting process, there are two membranes working together according to the designated valve pairs.'
                  : 'Dalam satu kali proses blasting, ada dua membran yang bekerja bersamaan sesuai pasangan katup (valve) yang ditentukan.'}
              </div>
              <div>
                <strong>{language === 'en' ? 'Example:' : 'Contoh:'}</strong>{' '}
                {language === 'en'
                  ? 'When valve number 4 performs blasting, valve number 27 will also perform blasting at the same time.'
                  : 'Ketika katup nomor 4 melakukan blasting, katup nomor 27 juga akan melakukan blasting pada saat yang sama.'}
              </div>
              <div>
                <strong>
                  {language === 'en'
                    ? 'Chamber Valve Division:'
                    : 'Pembagian ruang katup (chamber valve):'}
                </strong>
              </div>
              <div className="ml-4 space-y-1">
                <div>{language === 'en' ? '• Valve 1–15: Chamber 1' : '• Katup 1–15: Ruang 1'}</div>
                <div>
                  {language === 'en' ? '• Valve 16–30: Chamber 2' : '• Katup 16–30: Ruang 2'}
                </div>
                <div>
                  {language === 'en' ? '• Valve 31–45: Chamber 3' : '• Katup 31–45: Ruang 3'}
                </div>
              </div>
              <div>
                <em>
                  {language === 'en'
                    ? 'These rules apply to all hoppers.'
                    : 'Ketentuan ini berlaku untuk seluruh hopper.'}
                </em>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <EnhancedButton variant="primary" size="md" onClick={handleSaveInspection}>
            {language === 'en' ? 'Save Inspection' : 'Simpan Inspeksi'}
          </EnhancedButton>

          <EnhancedButton variant="secondary" size="md" onClick={() => window.location.reload()}>
            {language === 'en' ? 'Reset Form' : 'Reset Formulir'}
          </EnhancedButton>
        </div>
      </div>
    </div>
  );
};

const GeneralInspectionTab: React.FC<TabComponentProps> = ({ language }) => {
  return (
    <div className="text-center py-12">
      <ClipboardCheckIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {language === 'en' ? 'General Inspection (Coming Soon)' : 'Inspeksi Umum (Segera Hadir)'}
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        {language === 'en'
          ? 'General inspection form will be implemented here'
          : 'Formulir inspeksi umum akan diimplementasikan di sini'}
      </p>
    </div>
  );
};

const SafetyChecklistTab: React.FC<TabComponentProps> = ({ language }) => {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🛡️</div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {language === 'en'
          ? 'Safety Checklist (Coming Soon)'
          : 'Checklist Keselamatan (Segera Hadir)'}
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        {language === 'en'
          ? 'Safety checklist form will be implemented here'
          : 'Formulir checklist keselamatan akan diimplementasikan di sini'}
      </p>
    </div>
  );
};

const DocumentationTab: React.FC<TabComponentProps> = ({ language }) => {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📄</div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {language === 'en' ? 'Documentation (Coming Soon)' : 'Dokumentasi (Segera Hadir)'}
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        {language === 'en'
          ? 'Documentation upload and management will be implemented here'
          : 'Upload dan pengelolaan dokumentasi akan diimplementasikan di sini'}
      </p>
    </div>
  );
};

/**
 * Inspection Form Page
 *
 * Halaman formulir inspeksi dengan sistem tab
 */
const InspectionFormPage: React.FC<{
  language: 'en' | 'id';
  onNavigate: (page: Page, subPage?: string) => void;
}> = ({ language }) => {
  const [activeTab, setActiveTab] = useState<InspectionTab>('hose-valve-blasting-mbf');

  // Tab Configuration
  const tabs: TabConfig[] = [
    {
      id: 'general',
      label: {
        en: 'General Inspection',
        id: 'Inspeksi Umum',
      },
      icon: '📋',
    },
    {
      id: 'hose-valve-blasting-mbf',
      label: {
        en: 'Hose & Valve Blasting MBF',
        id: 'Hose & Valve Blasting MBF',
      },
      icon: '🔧',
    },
    {
      id: 'safety',
      label: {
        en: 'Safety Checklist',
        id: 'Checklist Keselamatan',
      },
      icon: '🛡️',
    },
    {
      id: 'documentation',
      label: {
        en: 'Documentation',
        id: 'Dokumentasi',
      },
      icon: '📄',
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'hose-valve-blasting-mbf':
        return <HoseValveBlastingMBFTab language={language} />;
      case 'general':
        return <GeneralInspectionTab language={language} />;
      case 'safety':
        return <SafetyChecklistTab language={language} />;
      case 'documentation':
        return <DocumentationTab language={language} />;
      default:
        return <HoseValveBlastingMBFTab language={language} />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center">
        <ClipboardCheckIcon className="w-6 h-6 mr-2 text-primary-600 dark:text-primary-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {language === 'en' ? 'New Inspection' : 'Inspeksi Baru'}
        </h1>
      </div>

      <EnhancedCard className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Inspection tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                aria-selected={activeTab === tab.id}
                role="tab"
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label[language]}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">{renderTabContent()}</div>
      </EnhancedCard>
    </div>
  );
};

export default InspectionFormPage;


