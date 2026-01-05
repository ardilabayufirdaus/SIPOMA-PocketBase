import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';

import { useCcrParameterData } from '../../hooks/useCcrParameterData';
import useCcrDowntimeData from '../../hooks/useCcrDowntimeData';
import { getKnowledge } from './knowledgeBase';
import { useChatbot } from '../../contexts/ChatbotContext';
import { useParameterSettings } from '../../hooks/useParameterSettings';
import { useWorkInstructions } from '../../hooks/useWorkInstructions';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import { useUsers } from '../../hooks/useUsers';
import { useCcrSiloData } from '../../hooks/useCcrSiloData';
import { useProjects } from '../../hooks/useProjects';
import { useCcrMaterialUsage } from '../../hooks/useCcrMaterialUsage'; // NEW
import { useCcrInformationData } from '../../hooks/useCcrInformationData'; // NEW
import { useCcrFooterData } from '../../hooks/useCcrFooterData'; // NEW
import { genAIService } from '../../services/genAIService';
import { CcrSiloData, CcrDowntimeData, CcrParameterData, ParameterSetting } from '../../types';
import { CcrParameterDataWithName } from '../../hooks/useCcrParameterData';
// Import MaterialUsageData type, assuming it is exported now
import { MaterialUsageData } from '../../hooks/useCcrMaterialUsage';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  type?: 'text' | 'data' | 'suggestion';
  data?: unknown;
}

const SUGGESTIONS = [
  'Berapa nilai Feed hari ini?',
  'Cek masalah Downtime terbaru',
  'Kenapa Blaine turun?',
  'Apa rekomendasi untuk Vibrasi tinggi?',
];

export const AIChatbot: React.FC = () => {
  // State from Context
  const { isOpen, closeChat } = useChatbot();

  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Halo! Saya asisten virtual Plant Operations. Ada yang bisa saya bantu terkait data operasi atau masalah teknis?',
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // GenAI Settings
  // Hardcoded API Key check (Moved to ENV)
  const apiKey = import.meta.env.VITE_XAI_API_KEY || '';

  // Data Hooks  // 1. Data Retrieval
  const today = new Date().toISOString().split('T')[0];
  const { getDataForDateRange, getDataForDate } = useCcrParameterData();
  // Call without date argument to fetch broad history (last 1000 records)
  const { getAllDowntime } = useCcrDowntimeData();
  const { records: paramSettings } = useParameterSettings();
  const { records: plantUnits } = usePlantUnits();
  const { users: userList } = useUsers();
  const { instructions: sopList } = useWorkInstructions();
  const { getDataForDate: getSiloData } = useCcrSiloData();
  const { projects: projectList } = useProjects();
  const { getDataForDate: getMaterialData } = useCcrMaterialUsage(); // NEW
  const { getInformationForDate } = useCcrInformationData(); // NEW
  const { getFooterDataForDate } = useCcrFooterData(); // NEW

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Context Search Engine
  const searchContext = (query: string) => {
    const lowerQuery = query.toLowerCase();
    const contextResults: string[] = [];

    // 1. Search Parameter Settings (Limits/Targets)
    const foundParams = paramSettings.filter((p) => lowerQuery.includes(p.parameter.toLowerCase()));
    foundParams.forEach((p) => {
      contextResults.push(
        `[Parameter Config] ${p.parameter}: Target=${p.min_value}-${p.max_value} ${p.unit}.`
      );
    });

    // 2. Search Work Instructions (SOPs)
    const foundSOPs = sopList.filter(
      (doc) =>
        lowerQuery.includes(doc.doc_title.toLowerCase()) ||
        lowerQuery.includes(doc.activity.toLowerCase()) ||
        lowerQuery.includes(doc.description.toLowerCase())
    );
    foundSOPs.forEach((doc) => {
      contextResults.push(`[SOP Found] ${doc.doc_title}: ${doc.description} (Link: ${doc.link})`);
    });

    // 3. Search Users (Contacts)
    const foundUsers = userList.filter(
      (u) =>
        lowerQuery.includes(u.full_name.toLowerCase()) || lowerQuery.includes(u.role.toLowerCase())
    );
    foundUsers.forEach((u) => {
      contextResults.push(
        `[Person] ${u.full_name} (${u.role}) - Status: ${u.is_active ? 'Active' : 'Inactive'}`
      );
    });

    // 4. Search Plant Units
    const foundUnits = plantUnits.filter(
      (u) =>
        lowerQuery.includes(u.unit.toLowerCase()) || lowerQuery.includes(u.category.toLowerCase())
    );
    foundUnits.forEach((u) => {
      contextResults.push(`[Unit info] ${u.unit} is part of ${u.category}`);
    });

    return contextResults;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate thinking delay
    setTimeout(async () => {
      const response = await generateResponse(text);
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 1000);
  };

  // Phase 3: Automated Root Cause Analysis (RCA) Engine
  const analyzeRootCause = async (downtime: CcrDowntimeData) => {
    try {
      const downtimeHour = parseInt(downtime.start_time.split(':')[0]); // e.g., "14:30" -> 14
      if (isNaN(downtimeHour)) return null;

      // Fetch parameter data for the day of downtime
      const paramData = await getDataForDate(downtime.date, 'all');

      const anomalies: string[] = [];
      const checkHours = [downtimeHour, downtimeHour - 1, downtimeHour - 2].filter((h) => h >= 0);

      for (const record of paramData) {
        const setting = paramSettings.find(
          (p) => p.parameter === record.name || p.id === record.parameter_id
        );
        if (setting && (setting.min_value !== null || setting.max_value !== null)) {
          for (const h of checkHours) {
            const valObj = record.hourly_values[h];
            let val: number | null = null;
            if (typeof valObj === 'number') val = valObj;
            else if (typeof valObj === 'object' && valObj !== null && 'value' in valObj)
              val = Number(valObj.value);
            else if (typeof valObj === 'string' && !isNaN(Number(valObj))) val = Number(valObj);

            if (val !== null) {
              if (
                setting.max_value !== undefined &&
                setting.max_value !== null &&
                val > setting.max_value
              ) {
                anomalies.push(
                  `- ${record.name || setting.parameter} TINGGI (${val} ${setting.unit}) pada jam ${h}:00 (Max: ${setting.max_value})`
                );
              }
              if (
                setting.min_value !== undefined &&
                setting.min_value !== null &&
                val < setting.min_value
              ) {
                anomalies.push(
                  `- ${record.name || setting.parameter} RENDAH (${val} ${setting.unit}) pada jam ${h}:00 (Min: ${setting.min_value})`
                );
              }
            }
          }
        }
      }
      const uniqueAnomalies = Array.from(new Set(anomalies));
      if (uniqueAnomalies.length > 0)
        return `\n\n🕵️‍♂️ **Analisa RCA Otomatis:**\nTerdeteksi anomali parameter sebelum interupsi:\n${uniqueAnomalies.slice(0, 5).join('\n')}`;
      return null;
    } catch (e) {
      console.error('RCA Error', e);
      return null;
    }
  };

  const generateResponse = async (query: string): Promise<Message> => {
    // Step 1: Gather ALL Context (System Knowledge)
    const todayStr = new Date().toISOString().split('T')[0];
    let contextData = '';

    // A. Search Context (SOP, Params, Users, Units)
    const searchHits = searchContext(query);
    if (searchHits.length > 0) {
      contextData += 'INFORMATION FOUND IN DATABASE:\n' + searchHits.join('\n') + '\n\n';
    }

    // B. Downtime Data (Always provide recent downtime context)
    const downtimes = getAllDowntime();
    if (downtimes.length > 0) {
      contextData += `RECENT DOWNTIMES:\n${downtimes
        .slice(0, 5)
        .map((d) => `- ${d.unit}: ${d.problem} at ${d.start_time}`)
        .join('\n')}\n\n`;
    }

    // NEW: Silo Data (Inventory) - Fetched on demand
    try {
      const siloRecords = await getSiloData(todayStr);
      if (siloRecords && siloRecords.length > 0) {
        contextData += `SILO LEVELS (Stock):\n${siloRecords.map((s: CcrSiloData) => `- ${s.silo_name || 'Silo'}: ${s.weight_value || 0} ${s.unit_id || ''} (Cap: ${s.capacity || 0})`).join('\n')}\n\n`;
      }
    } catch (e) {
      console.warn('Failed to fetch silo data for AI', e);
    }

    // NEW: Project Data
    if (projectList && projectList.length > 0) {
      contextData += `ACTIVE PROJECTS:\n${projectList
        .slice(0, 5)
        .map((p) => `- ${p.title} (Status: ${p.status})`)
        .join('\n')}\n\n`;
    }

    // --- NEW: FETCH ADDITIONAL CCR DATA (Today's Snapshot) ---

    // 1. Material Usage
    try {
      const materialData = await getMaterialData(todayStr);
      if (materialData && materialData.length > 0) {
        contextData += `MATERIAL USAGE (Today):\n${materialData.map((m: MaterialUsageData) => `- ${m.plant_unit}: Total Production=${m.total_production}, Clinker=${m.clinker}`).join('\n')}\n\n`;
      }
    } catch (e) {
      console.warn('Failed to fetch material usage for AI', e);
    }

    // 2. Information / Logs
    // Note: getInformationForDate needs plantUnit, so we might skip or loop.
    // For now, let's just note that this hook is available if specific unit context is needed.
    // Ideally we would fetch high level info logs here.
    // Since getInformationForDate is synchronous filter, we rely on cached data.
    // Let's iterate known units for logs:
    const unitsToCheck = ['Packer', 'Finish Mill', 'Kiln', 'Raw Mill'];
    let infoLogs = '';
    unitsToCheck.forEach((u) => {
      const info = getInformationForDate(todayStr, u);
      if (info && info.information) infoLogs += `- ${u}: ${info.information}\n`;
    });
    if (infoLogs) contextData += `OPERATOR LOGS (Today):\n${infoLogs}\n\n`;

    // 3. Footer Data (Production Stats)
    try {
      const footerData = await getFooterDataForDate(todayStr);
      if (footerData && footerData.length > 0) {
        contextData += `PRODUCTION STATS (Summary):\n${footerData
          .slice(0, 5)
          .map((f) => `- ${f.plant_unit} (${f.parameter_id}): Total=${f.total}, Avg=${f.average}`)
          .join('\n')}\n\n`;
      }
    } catch (e) {
      console.warn('Failed to fetch footer data for AI', e);
    }
    // ---------------------------------------------------------

    // C. Parameter Data (Last 3 Days Snapshot)
    // Fetch broad context to allow historical questions
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const dateFrom = threeDaysAgo.toISOString().split('T')[0];
    const dateTo = new Date().toISOString().split('T')[0];

    try {
      const parameters = await getDataForDateRange(dateFrom, dateTo);
      const getLatestFromRecord = (record: CcrParameterDataWithName) => {
        if (!record.hourly_values) return null;
        const hours = Object.keys(record.hourly_values)
          .map(Number)
          .sort((a, b) => b - a);
        for (const h of hours) {
          const valObj = record.hourly_values[h];
          if (valObj !== null && valObj !== undefined) {
            const v = typeof valObj === 'object' ? valObj.value : valObj;
            if (v !== '' && v !== null) return { value: v, hour: h };
          }
        }
        return null;
      };

      const paramMap = new Map<string, { date: string; hour: number; value: unknown }>();
      parameters.forEach((p) => {
        const best = getLatestFromRecord(p);
        if (best) {
          const name = p.name || p.parameter_id;
          const current = paramMap.get(name);
          if (!current || new Date(p.date) > new Date(current.date)) {
            paramMap.set(name, { date: p.date, hour: best.hour, value: best.value });
          }
        }
      });

      if (paramMap.size > 0) {
        contextData +=
          'LATEST PARAMETER VALUES (Snapshot 3 Hari):\n' +
          Array.from(paramMap.entries())
            .map(
              ([name, data]) =>
                `- ${name}: ${data.value} (Last update: ${data.date} Jam ${data.hour})`
            )
            .join('\n') +
          '\n\n';
      }
    } catch (err) {
      console.error('Error fetching parameter context', err);
    }

    // D. RCA Context (if applicable)
    if (query.toLowerCase().includes('trip') || query.toLowerCase().includes('masalah')) {
      for (const dt of downtimes.slice(0, 3)) {
        const rca = await analyzeRootCause(dt);
        if (rca) contextData += `RCA ANALYSIS for ${dt.problem}:\n${rca}\n\n`;
      }
    }

    // E. Knowledge Base (Manual Fallback)
    const kbInfo = getKnowledge(query);
    if (kbInfo.analysis !== 'Data tidak tersedia.') {
      contextData += `MANUAL KNOWLEDGE BASE:\n${kbInfo.analysis}\nInfluencers: ${kbInfo.influencers.join(',')}\n\n`;
    }

    // --- DECISION: GEN AI OR RULE BASED? ---
    if (apiKey) {
      const aiResponse = await genAIService.sendMessage(apiKey, contextData, query);
      return {
        id: Date.now().toString(),
        sender: 'bot',
        text: aiResponse,
        timestamp: new Date(),
      };
    } else {
      let finalText = 'Mode: Offline Logic (Set API Key untuk Smart AI).\n\n';
      if (contextData) finalText += 'Saya menemukan data berikut sistem:\n' + contextData;
      else finalText += 'Maaf, saya tidak mengerti dan tidak ada konteks sistem yang cocok.';

      return {
        id: Date.now().toString(),
        sender: 'bot',
        text: finalText,
        timestamp: new Date(),
      };
    }
  };

  // ... (keep return logic but remove Toggle Button and use context isOpen)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-24 right-6 w-96 max-h-[600px] z-[9999] flex flex-col shadow-2xl rounded-2xl overflow-hidden font-sans"
        >
          <Card className="flex flex-col h-full border-0 shadow-none">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Bot className="w-5 h-5 text-indigo-400" />
                    Plant Ops Assistant
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={closeChat}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 bg-slate-50 overflow-y-auto p-4 space-y-4 min-h-[350px] max-h-[450px]">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : 'bg-white text-slate-700 border border-slate-200 rounded-tl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span
                      className={`text-[10px] mt-1.5 block ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}
                    >
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions (Quick Chips) */}
            <div className="bg-slate-50 px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar mask-gradient-r">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSendMessage(s)}
                  className="whitespace-nowrap flex-shrink-0 text-xs bg-white border border-indigo-100 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
              <div className="flex items-center gap-2 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                  placeholder="Tanya tentang data operasi..."
                  className="flex-1 bg-slate-100 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white border border-transparent focus:border-indigo-200 transition-all placeholder:text-slate-400"
                />
                <button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!inputValue.trim() || isTyping}
                  className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center mt-2">
                <p className="text-[10px] text-slate-400">
                  AI dapat melakukan kesalahan. Pastikan verifikasi data di dashboard.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
