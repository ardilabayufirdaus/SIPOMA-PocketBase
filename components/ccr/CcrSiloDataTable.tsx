import React, { useCallback } from "react";
import { CcrSiloData } from "../../types";

interface CcrSiloDataTableProps {
  t: any;
  loading: boolean;
  dailySiloData: CcrSiloData[];
  siloMasterMap: Map<string, any>;
  formatInputValue: (value: any) => string;
  parseInputValue: (value: string) => number | null;
  handleSiloDataChange: (
    siloId: string,
    shift: "shift1" | "shift2" | "shift3",
    field: "emptySpace" | "content",
    value: string
  ) => void;
  getInputRef: (
    table: "silo" | "parameter",
    row: number,
    col: number
  ) => string;
  setInputRef: (key: string, element: HTMLInputElement | null) => void;
  handleKeyDown: (
    e: React.KeyboardEvent,
    table: "silo" | "parameter",
    currentRow: number,
    currentCol: number
  ) => void;
}

const CcrSiloDataTable: React.FC<CcrSiloDataTableProps> = ({
  t,
  loading,
  dailySiloData,
  siloMasterMap,
  formatInputValue,
  parseInputValue,
  handleSiloDataChange,
  getInputRef,
  setInputRef,
  handleKeyDown,
  selectedCategory,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow space-y-3">
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1 truncate">
        {t.ccr_data_entry_title}
      </h3>
      <div className="overflow-x-auto">
        <table
          className="min-w-full divide-y divide-slate-200 border border-slate-200 text-xs"
          aria-label="Silo Data Table"
        >
          <thead className="bg-slate-50 text-center">
            <tr>
              <th
                rowSpan={2}
                className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-r align-middle"
              >
                {t.silo_name}
              </th>
              <th
                colSpan={3}
                className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-b"
              >
                {t.shift_1}
              </th>
              <th
                colSpan={3}
                className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-b"
              >
                {t.shift_2}
              </th>
              <th
                colSpan={3}
                className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b"
              >
                {t.shift_3}
              </th>
            </tr>
            <tr>
              {[...Array(3)].flatMap((_, i) => [
                <th
                  key={`es-${i}`}
                  className="px-2 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider border-r"
                >
                  {t.empty_space}
                </th>,
                <th
                  key={`c-${i}`}
                  className="px-2 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider border-r"
                >
                  {t.content}
                </th>,
                <th
                  key={`p-${i}`}
                  className={`px-2 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider ${
                    i < 2 ? "border-r" : ""
                  }`}
                >
                  {t.percentage}
                </th>,
              ])}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td
                  colSpan={10}
                  className="text-center py-10 text-slate-500 animate-pulse"
                >
                  Loading data...
                </td>
              </tr>
            ) : (
              dailySiloData.map((siloData, siloIndex) => {
                const masterSilo = siloMasterMap.get(siloData.silo_id);
                if (!masterSilo) return null;

                const shifts: ("shift1" | "shift2" | "shift3")[] = [
                  "shift1",
                  "shift2",
                  "shift3",
                ];

                return (
                  <tr key={siloData.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-slate-900 border-r sticky left-0 bg-white z-10">
                      {masterSilo.silo_name}
                    </td>
                    {shifts.map((shift, i) => {
                      const content = siloData[shift]?.content;
                      const capacity = masterSilo.capacity;
                      const percentage =
                        capacity > 0 && typeof content === "number"
                          ? (content / capacity) * 100
                          : 0;

                      return (
                        <React.Fragment key={shift}>
                          <td
                            className={`px-1 py-1 whitespace-nowrap text-sm border-r ${
                              siloIndex % 2 === 0 ? "bg-slate-50" : "bg-white"
                            } transition-colors duration-200`}
                          >
                            <input
                              ref={(el) => {
                                const refKey = getInputRef(
                                  "silo",
                                  siloIndex,
                                  i * 2
                                );
                                setInputRef(refKey, el);
                              }}
                              type="text"
                              value={formatInputValue(
                                siloData[shift]?.emptySpace
                              )}
                              onChange={(e) => {
                                const parsed = parseInputValue(e.target.value);
                                handleSiloDataChange(
                                  siloData.silo_id,
                                  shift,
                                  "emptySpace",
                                  parsed !== null ? parsed.toString() : ""
                                );
                              }}
                              onBlur={(e) => {
                                const parsed = parseInputValue(e.target.value);
                                if (parsed !== null) {
                                  e.target.value = formatInputValue(parsed);
                                }
                              }}
                              onKeyDown={(e) =>
                                handleKeyDown(e, "silo", siloIndex, i * 2)
                              }
                              className="w-full text-center px-1 py-1 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-xs transition-all duration-200 hover:border-slate-400"
                              aria-label={`Empty Space for ${masterSilo.silo_name} ${shift}`}
                              title={`Isi ruang kosong untuk ${
                                masterSilo.silo_name
                              } shift ${i + 1}`}
                              placeholder="0,0"
                            />
                          </td>
                          <td
                            className={`px-1 py-1 whitespace-nowrap text-sm border-r ${
                              siloIndex % 2 === 0 ? "bg-slate-50" : "bg-white"
                            } transition-colors duration-200`}
                          >
                            <input
                              ref={(el) => {
                                const refKey = getInputRef(
                                  "silo",
                                  siloIndex,
                                  i * 2 + 1
                                );
                                setInputRef(refKey, el);
                              }}
                              type="text"
                              value={formatInputValue(content)}
                              onChange={(e) => {
                                const parsed = parseInputValue(e.target.value);
                                handleSiloDataChange(
                                  siloData.silo_id,
                                  shift,
                                  "content",
                                  parsed !== null ? parsed.toString() : ""
                                );
                              }}
                              onBlur={(e) => {
                                const parsed = parseInputValue(e.target.value);
                                if (parsed !== null) {
                                  e.target.value = formatInputValue(parsed);
                                }
                              }}
                              onKeyDown={(e) =>
                                handleKeyDown(e, "silo", siloIndex, i * 2 + 1)
                              }
                              className="w-full text-center px-1 py-1 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-xs transition-all duration-200 hover:border-slate-400"
                              aria-label={`Content for ${masterSilo.silo_name} ${shift}`}
                              title={`Isi konten untuk ${
                                masterSilo.silo_name
                              } shift ${i + 1} (Max: ${masterSilo.capacity})`}
                              placeholder="0,0"
                            />
                          </td>
                          <td
                            className={`px-2 py-2 whitespace-nowrap text-sm text-center text-slate-600 align-middle ${
                              i < 2 ? "border-r" : ""
                            }`}
                          >
                            <div className="relative w-full h-6 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="absolute top-0 left-0 h-full bg-red-500 transition-all duration-300"
                                style={{
                                  width: `${Math.min(100, percentage)}%`,
                                }}
                              ></div>
                              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white mix-blend-difference">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              })
            )}
            {dailySiloData.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="text-center py-10 text-slate-500 dark:text-slate-400"
                >
                  {!selectedCategory
                    ? "No plant categories found in Master Data."
                    : `No silo master data found for the category: ${selectedCategory}.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(CcrSiloDataTable);
