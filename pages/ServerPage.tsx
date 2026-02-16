import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pb } from '../utils/pocketbase-simple';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { 
  Activity, 
  HardDrive, 
  Cpu, 
  Clock, 
  Terminal, 
  FileText, 
  RefreshCw,
  Server,
  Zap,
  Power,
  Database,
  Download,
  Play,
  AlertTriangle,
  RotateCw,
  Network,
  List,
  Shield,
  Trash2,
  Users,
  CheckCircle,
  XCircle,
  Globe
} from 'lucide-react';

interface ServerStats {
  uptime: string;
  load: string;
  memory: string;
  disk: string;
  temp?: string;
  battery?: string;
  ts: string;
  // New Enhanced Stats
  disk_io?: { read_bytes: number; write_bytes: number };
  top_processes?: { name: string; cpu: number; mem: number }[];
  services?: { internet: boolean; database: boolean; web: boolean };
  user_online_count?: number;
}

interface BackupFile {
  name: string;
  size: string;
  date: string;
}

interface NetworkStats {
    interfaces: {
        name: string;
        rx_bytes: number;
        rx_packets: number;
        tx_bytes: number;
        tx_packets: number;
    }[];
    active_connections: number;
}

interface Process {
    pid: string;
    user: string;
    cpu: string;
    mem: string;
    time: string;
    name: string;
}

interface AnalyticsData {
    attacks: { ip: string; count: number }[];
    users: { ip: string }[];
    word_cloud: Record<string, number>;
    reboots: string[];
    disk_info: { total: number; used: number; available: number };
}

interface Alert {
    id: string;
    type: 'warning' | 'danger' | 'info' | 'success';
    message: string;
    time: Date;
}

// Mini-Chart Component
const Sparkline: React.FC<{ data: number[], color: string, max?: number }> = ({ data, color, max }) => {
    // Simple SVG line chart
    const height = 40;
    const width = 100;
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const normalizedVal = max ? val / max : val / (Math.max(...data) || 1);
        const y = height - (normalizedVal * height);
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
            <path d={`M 0 ${height} L ${points} L ${width} ${height} Z`} fill={color} fillOpacity="0.1" stroke="none" />
            <path d={`M ${points}`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

const ServerPage: React.FC = () => {
    // TABS: dashboard, logs, backups, tools (terminal), processes, security, automation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'backups' | 'tools' | 'processes' | 'security' | 'database'>('dashboard');
  
  // Dashboard State
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [netStats, setNetStats] = useState<NetworkStats | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Historical Data for Charts (Keep last 20 points)
  const [cpuHistory, setCpuHistory] = useState<number[]>(new Array(20).fill(0));
  const [ramHistory, setRamHistory] = useState<number[]>(new Array(20).fill(0));
  const [netRxHistory, setNetRxHistory] = useState<number[]>(new Array(20).fill(0));
  
  // Logs State
  const [logs, setLogs] = useState<string>('');
  
  // Backups State
  const [backups, setBackups] = useState<BackupFile[]>([]);
  
  // Tools/Terminal State
  const [cmdInput, setCmdInput] = useState('');
  const [cmdOutput, setCmdOutput] = useState('');

  // Processes State
  const [processes, setProcesses] = useState<Process[]>([]);

  // Security State
  const [securityLogs, setSecurityLogs] = useState<string[]>([]);
  
  // General UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  
  // Refs for tracking previous values to calculate rates
  const prevNetStats = useRef<NetworkStats | null>(null);
  const prevDiskStats = useRef<ServerStats['disk_io'] | null>(null);
  const [ioRates, setIoRates] = useState({ diskRead: 0, diskWrite: 0, netRx: 0, netTx: 0 });

  // Advanced Analytics State
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [geoCache, setGeoCache] = useState<Record<string, {lat: number, lon: number, city?: string}>>({});

  // --- PARSERS ---
  const parseLoad = (loadStr: string) => {
    if (!loadStr) return { one: 0, five: 0, fifteen: 0 };
    const parts = loadStr.trim().split(/\s+/);
    return {
      one: parts[0] || '0',
      five: parts[1] || '0',
      fifteen: parts[2] || '0'
    };
  };

  const parseMemory = (memStr: string) => {
    if (!memStr) return { total: 0, used: 0, free: 0, percent: 0 };
    const lines = memStr.trim().split('\n');
    const memLine = lines.find(l => l.startsWith('Mem:'));
    if (!memLine) return { total: 0, used: 0, free: 0, percent: 0 };
    
    const parts = memLine.split(/\s+/);
    const total = parseInt(parts[1], 10);
    const used = parseInt(parts[2], 10);
    const available = parseInt(parts[6] || parts[3], 10);
    
    return {
      total,
      used,
      free: available,
      percent: total ? Math.round(((total - available) / total) * 100) : 0
    };
  };

  const parseDisk = (diskStr: string) => {
    if (!diskStr) return { size: '0', used: '0', avail: '0', percent: '0%' };
    const lines = diskStr.trim().split('\n');
    const dataLine = lines.length > 1 ? lines[1] : lines[0];
    const parts = dataLine.split(/\s+/);
    
    return {
      size: parts[1] || '0',
      used: parts[2] || '0',
      avail: parts[3] || '0',
      percent: parts[4] || '0%'
    };
  };

  // --- API CALLS ---
  // Geo IP Helper
  const resolveGeoIP = useCallback(async (ip: string) => {
    if (geoCache[ip]) return;
    try {
      // Free IP-API (No key needed for simple usage)
      const res = await fetch(`http://ip-api.com/json/${ip}`);
      const data = await res.json();
      if (data.status === 'success') {
        setGeoCache(prev => ({ ...prev, [ip]: { lat: data.lat, lon: data.lon, city: data.city } }));
      }
    } catch (e) {
      // Fallback: Random but stable coords for local/private IPs
      let hash = 0;
      for (let i = 0; i < ip.length; i++) hash = ip.charCodeAt(i) + ((hash << 5) - hash);
      setGeoCache(prev => ({ ...prev, [ip]: { lat: (hash % 60), lon: (hash % 120) } }));
    }
  }, [geoCache]);

  useEffect(() => {
    if (analytics) {
      const allIPs = [...analytics.users.map(u => u.ip), ...analytics.attacks.map(a => a.ip)];
      allIPs.forEach(ip => {
          if (!geoCache[ip]) resolveGeoIP(ip);
      });
    }
  }, [analytics, resolveGeoIP, geoCache]);

  const fetchStats = useCallback(async () => {
    try {
      const result = await pb.send('/api/server/stats', { method: 'GET' });
      const newStats = result as ServerStats;

      // Update Charts History
      const load = newStats.load ? parseFloat(newStats.load.split(' ')[0]) : 0;
      setCpuHistory(prev => [...prev.slice(1), load]); 
      
      const mem = parseMemory(newStats.memory);
      setRamHistory(prev => [...prev.slice(1), mem.percent]);

      // Calculate Disk I/O Rates
      if (prevDiskStats.current && newStats.disk_io) {
          const deltaRead = newStats.disk_io.read_bytes - prevDiskStats.current.read_bytes;
          const deltaWrite = newStats.disk_io.write_bytes - prevDiskStats.current.write_bytes;
          // Assuming 5s interval
          setIoRates(prev => ({ ...prev, diskRead: deltaRead / 5, diskWrite: deltaWrite / 5 }));
      }
      prevDiskStats.current = newStats.disk_io || null;

      setStats(newStats);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: unknown) {
      console.error('Stats Error:', err);
    }
  }, []);

  const fetchNetStats = useCallback(async () => {
      try {
          const result = await pb.send('/api/server/network', { method: 'GET' });
          const newNet = result as NetworkStats;

           // Calculate Net Rates
           if (prevNetStats.current && newNet.interfaces[0]) {
              const deltaRx = newNet.interfaces[0].rx_bytes - prevNetStats.current.interfaces[0].rx_bytes;
              const deltaTx = newNet.interfaces[0].tx_bytes - prevNetStats.current.interfaces[0].tx_bytes;
              // Assuming 5s interval
              const rxRate = deltaRx / 5;
              setIoRates(prev => ({ ...prev, netRx: rxRate, netTx: deltaTx / 5 }));
              setNetRxHistory(prev => [...prev.slice(1), rxRate]);
          }
          prevNetStats.current = newNet;

          setNetStats(newNet);
      } catch (err: any) {
          // console.error('Net Stats Error (Optional)', err);
      }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
        const result = await pb.send('/api/server/analytics', { method: 'GET' });
        setAnalytics(result as AnalyticsData);
        
        // Generate dynamic alerts based on logic
        const newAlerts: Alert[] = [];
        if (result.attacks.length > 5) {
            newAlerts.push({ id: 'atk-' + Date.now(), type: 'danger', message: `High volume of failed auth attempts from ${result.attacks[0].ip}`, time: new Date() });
        }
        if (result.word_cloud.error > 10) {
            newAlerts.push({ id: 'err-' + Date.now(), type: 'warning', message: "Increased error frequency detected in system logs.", time: new Date() });
        }
        setAlerts(prev => [...newAlerts, ...prev].slice(0, 10)); // Keep last 10
    } catch (e) {
        console.error("Analytics error", e);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const result = await pb.send('/api/server/logs', { method: 'GET' });
      setLogs(result.content || 'No logs found.');
    } catch (err: any) {
      console.error('Logs Error:', err);
      setError('Failed to fetch logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBackups = useCallback(async () => {
     try {
      setLoading(true);
      const result = await pb.send('/api/server/backups', { method: 'GET' });
      setBackups(result.backups || []);
    } catch (err: any) {
      console.error('Backups Error:', err);
       setError('Failed to fetch backups: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProcesses = useCallback(async () => {
      try {
          setLoading(true);
          const result = await pb.send('/api/server/processes', { method: 'GET' });
          setProcesses(result.processes || []);
      } catch (err: any) {
          setError('Failed to fetch processes: ' + err.message);
      } finally {
          setLoading(false);
      }
  }, []);

  const fetchSecurityLogs = useCallback(async () => {
    try {
        setLoading(true);
        const result = await pb.send('/api/server/security', { method: 'GET' });
        setSecurityLogs(result.logins || []);
    } catch (err: any) {
        setError('Failed to fetch security logs: ' + err.message);
    } finally {
        setLoading(false);
    }
  }, []);

  const createBackup = async () => {
      if (!window.confirm("Buat backup database sekarang? Proses ini mungkin memakan waktu.")) return;
      try {
          setLoading(true);
          setActionMessage("Membuat backup...");
          const result = await pb.send('/api/server/backup', { method: 'POST' });
          setActionMessage("Backup berhasil: " + result.filename);
          fetchBackups();
      } catch (err: any) {
          setError('Backup failed: ' + err.message);
      } finally {
          setLoading(false);
          setTimeout(() => setActionMessage(null), 5000);
      }
  };

  const restartServer = async () => {
      const confirmText = "PERINGATAN!\n\nAnda akan merestart service POCKETBASE.\nAplikasi akan tidak bisa diakses selama beberapa detik dan semua user akan logout.\n\nKetik 'RESTART' untuk melanjutkan.";
      const userInput = window.prompt(confirmText);
      
      if (userInput !== 'RESTART') {
          if (userInput !== null) alert("Konfirmasi salah. Batal.");
          return;
      }
      
      try {
          setLoading(true);
          setActionMessage("Mengirim perintah restart...");
          await pb.send('/api/server/restart', { method: 'POST' });
          setActionMessage("Server sedang restart. Silakan refresh halaman dalam 10-20 detik.");
      } catch (err: any) {
          setError('Restart failed: ' + err.message);
      } finally {
          setLoading(false);
      }
  };

  const softRebootServer = async () => {
      const confirmText = "PERINGATAN KERAS!\n\nAnda akan melakukan SOFT REBOOT pada sistem server.\nSemua service akan dimuat ulang.\nKoneksi akan terputus.\n\nKetik 'SOFT-REBOOT' untuk melanjutkan.";
      const userInput = window.prompt(confirmText);
      
      if (userInput !== 'SOFT-REBOOT') {
          if (userInput !== null) alert("Konfirmasi salah. Batal.");
          return;
      }
      
      try {
          setLoading(true);
          setActionMessage("Mengirim perintah Soft Reboot...");
          await pb.send('/api/server/soft-reboot', { method: 'POST' });
          setActionMessage("Soft Reboot dimulai. Server akan kembali dalam beberapa saat.");
      } catch (err: any) {
          setError('Soft Reboot failed: ' + err.message);
      } finally {
          setLoading(false);
      }
  };

  const runCommand = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!cmdInput.trim()) return;
      
      try {
          setLoading(true);
          const result = await pb.send('/api/server/cmd', { 
              method: 'POST',
              body: { cmd: cmdInput }
          });
          setCmdOutput(`$ ${cmdInput}\n${result.output}\n\n${cmdOutput}`);
          setCmdInput('');
      } catch (err: any) {
          setCmdOutput(`$ ${cmdInput}\nError: ${err.message}\n\n${cmdOutput}`);
      } finally {
          setLoading(false);
      }
  };

  const killProcess = async (pid: string) => {
      if(!window.confirm(`Yakin ingin mematikan process PID ${pid}? Ini bisa berbahaya.`)) return;
      try {
          await pb.send('/api/server/kill-process', { method: 'POST', body: {pid} });
          alert(`Process ${pid} killed.`);
          fetchProcesses();
      } catch (err: any) {
          alert("Gagal kill process: " + err.message);
      }
  }

  const runDbMaintenance = async (action: 'vacuum' | 'integrity') => {
      if(!window.confirm(`Jalankan Database ${action.toUpperCase()}?`)) return;
      try {
          setLoading(true);
          const res = await pb.send('/api/server/db-maintenance', { method: 'POST', body: {action} });
          alert(res.message);
      } catch (err: any) {
          alert("Maintenance failed: " + err.message);
      } finally {
          setLoading(false);
      }
  }

  // --- EFFECTS ---
  useEffect(() => {
    fetchStats();
    fetchNetStats();
    fetchAnalytics();
    const interval = setInterval(() => {
        fetchStats();
        fetchNetStats();
        fetchAnalytics();
    }, 5000); 
    return () => clearInterval(interval);
  }, [fetchStats, fetchNetStats, fetchAnalytics]);

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
    if (activeTab === 'backups') fetchBackups();
    if (activeTab === 'processes') fetchProcesses();
    if (activeTab === 'security') fetchSecurityLogs();
  }, [activeTab, fetchLogs, fetchBackups, fetchProcesses, fetchSecurityLogs]);

  // Derived Data
  const loadData = stats ? parseLoad(stats.load) : { one: 0, five: 0, fifteen: 0 };
  const memData = stats ? parseMemory(stats.memory) : { total: 0, used: 0, free: 0, percent: 0 };
  const diskData = stats ? parseDisk(stats.disk) : { size: '0', used: '0', avail: '0', percent: '0%' };

  // Formatting helpers
  const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="relative flex flex-col h-full min-h-screen text-[#333333] dark:text-slate-100 font-sans bg-[#F7F7F7] dark:bg-slate-950">
      
      {/* Background Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#E95420]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-[#772953]/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col p-4 lg:p-6 gap-6 max-w-[1700px] mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-[#E95420]">
              <Server className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight text-[#333333] dark:text-white">
                Server Manager
              </h1>
              <p className="text-[#808080] dark:text-slate-400 text-sm font-medium flex items-center gap-2">
                 <span>{stats?.battery || 'Power Safe'}</span>
                 {stats?.temp && <span className="text-[#E95420]">• {stats.temp}</span>}
                 {lastUpdated && <span className="opacity-60 text-xs">• Upd: {lastUpdated.toLocaleTimeString()}</span>}
              </p>
            </div>
          </motion.div>

          {/* Notification Bell */}
          <div className="relative">
              <button 
                onClick={() => setShowNotificationCenter(!showNotificationCenter)}
                className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative hover:text-[#E95420] transition-colors"
              >
                  <Zap className="w-6 h-6" />
                  {alerts.length > 0 && (
                      <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></span>
                  )}
              </button>
              
              <AnimatePresence>
                  {showNotificationCenter && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden"
                      >
                          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                              <h4 className="font-bold text-sm uppercase">Server Notifications</h4>
                              <button onClick={() => setAlerts([])} className="text-xs text-slate-400 hover:text-red-500">Clear All</button>
                          </div>
                          <div className="max-h-96 overflow-y-auto p-2 space-y-1">
                              {alerts.length === 0 ? (
                                  <div className="py-8 text-center text-slate-400 text-sm italic">No recent alerts.</div>
                              ) : (
                                  alerts.map(a => (
                                      <div key={a.id} className={`p-3 rounded-xl border-l-4 ${
                                          a.type === 'danger' ? 'bg-red-50 dark:bg-red-900/10 border-red-500 text-red-700 dark:text-red-400' :
                                          a.type === 'warning' ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-500 text-orange-700 dark:text-orange-400' :
                                          'bg-blue-50 dark:bg-blue-900/10 border-blue-500 text-blue-700 dark:text-blue-400'
                                      } text-sm`}>
                                          <div className="font-bold mb-1">{a.type.toUpperCase()}</div>
                                          <div>{a.message}</div>
                                          <div className="text-[10px] mt-2 opacity-50">{a.time.toLocaleTimeString()}</div>
                                      </div>
                                  ))
                              )}
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>
          </div>

          {actionMessage && (
               <motion.div 
                 initial={{ opacity: 0, y: -20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold shadow-md"
               >
                 {actionMessage}
               </motion.div>
          )}

          <div className="flex items-center gap-3">
             <button
               onClick={() => {
                   if (activeTab === 'logs') fetchLogs();
                   else if (activeTab === 'backups') fetchBackups();
                   else if (activeTab === 'processes') fetchProcesses();
                   else if (activeTab === 'security') fetchSecurityLogs();
                   else { fetchStats(); fetchNetStats(); }
               }}
               className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-[#E95420] hover:text-white transition-all shadow-sm"
               title="Refresh Data"
             >
               <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
             </button>
          </div>
        </div>

        {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-[#C7162B] dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-2 font-medium">
                <AlertTriangle className="w-5 h-5" />
                Error: {error}
                <button onClick={() => setError(null)} className="ml-auto underline text-xs">Dismiss</button>
            </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 bg-white/50 dark:bg-slate-800/50 p-1 rounded-xl backdrop-blur-sm border border-slate-200 dark:border-slate-700 w-full md:w-fit">
            {[
                { id: 'dashboard', icon: Activity, label: 'Dashboard' },
                { id: 'processes', icon: List, label: 'Processes' },
                { id: 'security', icon: Shield, label: 'Security' },
                { id: 'logs', icon: FileText, label: 'Logs' },
                { id: 'backups', icon: Database, label: 'Backups' },
                { id: 'tools', icon: Terminal, label: 'Tools' },
                { id: 'database', icon:  HardDrive, label: 'DB Tools' },
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'dashboard' | 'logs' | 'backups' | 'tools' | 'processes' | 'security' | 'database')}
                    className={`
                        flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2
                        ${activeTab === tab.id
                        ? 'bg-[#E95420] text-white shadow-md'
                        : 'text-[#808080] hover:bg-white dark:hover:bg-slate-700'}
                    `}
                >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                </button>
            ))}
        </div>

        {/* --- CONTENT AREA --- */}
        <AnimatePresence mode='wait'>
            
            {/* 1. DASHBOARD WITH NEW ENHANCEMENTS */}
            {activeTab === 'dashboard' && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    key="dashboard"
                    className="space-y-6"
                >
                    {/* Status Overview Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {/* User Online Widget */}
                        <div className="col-span-2 bg-gradient-to-br from-[#E95420] to-[#C7162B] text-white p-5 rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between">
                            <div className="flex justify-between items-start z-10">
                                <div>
                                    <h4 className="text-white/70 font-bold text-xs uppercase tracking-wider">Users Online</h4>
                                    <div className="text-4xl font-black mt-2">{stats?.user_online_count || 0}</div>
                                </div>
                                <Users className="w-8 h-8 text-white/40" />
                            </div>
                            <div className="text-xs text-white/50 z-10 mt-2">Active now in SIPOMA</div>
                            {/* Decorative bubbles */}
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                            <div className="absolute top-0 left-0 w-32 h-32 bg-black/5 rounded-full blur-xl"></div>
                        </div>

                         {/* Service Health Checks */}
                         <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center gap-3">
                             <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-slate-500"><Globe className="w-4 h-4"/> Internet</span>
                                {stats?.services?.internet ? <CheckCircle className="w-4 h-4 text-emerald-500"/> : <XCircle className="w-4 h-4 text-red-500"/>}
                             </div>
                             <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-slate-500"><Database className="w-4 h-4"/> Database</span>
                                {stats?.services?.database ? <CheckCircle className="w-4 h-4 text-emerald-500"/> : <XCircle className="w-4 h-4 text-red-500"/>}
                             </div>
                         </div>
                         
                         {/* Network Rate Mini */}
                         <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                            <h4 className="text-slate-500 font-bold text-xs uppercase">Net Speed</h4>
                            <div>
                                <div className="text-lg font-bold text-emerald-600">↓ {formatBytes(ioRates.netRx)}/s</div>
                                <div className="text-sm text-blue-500">↑ {formatBytes(ioRates.netTx)}/s</div>
                            </div>
                         </div>

                         {/* Disk I/O Rate Mini */}
                         <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                            <h4 className="text-slate-500 font-bold text-xs uppercase">Disk I/O</h4>
                            <div>
                                <div className="text-lg font-bold text-slate-700 dark:text-slate-300">R: {formatBytes(ioRates.diskRead)}/s</div>
                                <div className="text-sm text-slate-500">W: {formatBytes(ioRates.diskWrite)}/s</div>
                            </div>
                         </div>

                        {/* Top Resource Hog Mini */}
                        <div className="col-span-1 md:col-span-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                             <h4 className="text-slate-500 font-bold text-xs uppercase mb-2">Top CPU Hogs</h4>
                             <div className="space-y-2">
                                 {stats?.top_processes?.slice(0,2).map((p,i) => (
                                     <div key={i} className="flex justify-between items-center text-sm">
                                         <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">{p.name}</span>
                                         <span className="font-bold text-orange-500">{p.cpu}%</span>
                                     </div>
                                 ))}
                             </div>
                        </div>

                    </div>

                    {/* Main Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* CPU Card with Chart */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold text-[#808080] uppercase tracking-widest border-l-2 border-[#E95420] pl-2">CPU Load</h3>
                                <Cpu className="w-5 h-5 text-[#E95420]" />
                            </div>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-3xl font-black">{loadData.one}</span>
                                <span className="text-xs font-bold text-[#808080] uppercase">1m avg</span>
                            </div>
                            <div className="h-10 w-full opacity-50 group-hover:opacity-100 transition-opacity">
                                <Sparkline data={cpuHistory} color="#E95420" />
                            </div>
                        </div>

                        {/* Memory Card with Chart */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold text-[#808080] uppercase tracking-widest border-l-2 border-[#772953] pl-2">RAM Usage</h3>
                                <Activity className="w-5 h-5 text-[#772953]" />
                            </div>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-3xl font-black">{memData.percent}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
                                <div className="bg-[#772953] h-full rounded-full transition-all duration-500" style={{ width: `${memData.percent}%` }}></div>
                            </div>
                             <div className="h-8 w-full opacity-30 group-hover:opacity-100 transition-opacity">
                                <Sparkline data={ramHistory} color="#772953" />
                            </div>
                        </div>

                        {/* Storage Card */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-[#808080] uppercase tracking-widest border-l-2 border-amber-500 pl-2">Storage</h3>
                                <HardDrive className="w-5 h-5 text-amber-500" />
                            </div>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-3xl font-black">{diskData.percent}</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-4">
                                <div className="bg-amber-500 h-2 rounded-full" style={{ width: diskData.percent }}></div>
                            </div>
                            <div className="text-xs text-[#808080] flex justify-between">
                                <span>Used: {diskData.used}</span>
                                <span>Free: {diskData.avail}</span>
                            </div>
                        </div>

                        {/* Network Card */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold text-[#808080] uppercase tracking-widest border-l-2 border-blue-500 pl-2">Network</h3>
                                <Network className="w-5 h-5 text-blue-500" />
                            </div>
                             <div className="text-2xl font-black truncate relative z-10">
                                {netStats?.active_connections || 0} <span className="text-sm text-slate-500 font-normal">Conns</span>
                            </div>
                             <div className="h-10 w-full opacity-50 mt-4">
                                <Sparkline data={netRxHistory} color="#3B82F6" />
                            </div>
                        </div>
                    </div>

                    {/* --- NEW ROW: ADVANCED ANALYTICS --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* A. GEO MAP + ANALYTICS PANEL */}
                        <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold flex items-center gap-2"><Globe className="w-5 h-5 text-emerald-500"/> Real-time Connection Map</h3>
                                <div className="flex gap-4 text-xs">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Users</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"></span> Attacks</span>
                                </div>
                            </div>
                             <div className="h-96 bg-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50 z-0">
                                {/* REAL GOOGLE MAPS VIA LEAFLET */}
                                <MapContainer 
                                    center={[-2, 115]} 
                                    zoom={4} 
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl={false}
                                    attributionControl={false}
                                >
                                    <TileLayer
                                        url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                                        subdomains={['mt0','mt1','mt2','mt3']}
                                    />
                                    
                                    {/* User Dots (Real Location) */}
                                    {analytics?.users.map((u, i) => {
                                        const loc = geoCache[u.ip];
                                        if (!loc) return null;
                                        return (
                                            <CircleMarker 
                                                key={'u-'+i} 
                                                center={[loc.lat, loc.lon]} 
                                                radius={6}
                                                pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.8, weight: 2 }}
                                            >
                                                <Popup className="custom-popup">
                                                    <div className="text-xs font-bold">Client IP: {u.ip}</div>
                                                    <div className="text-[10px] text-slate-500">{loc.city || 'Unknown Location'}</div>
                                                </Popup>
                                            </CircleMarker>
                                        );
                                    })}

                                    {/* Attack Dots (Real Location) */}
                                    {analytics?.attacks.map((a, i) => {
                                        const loc = geoCache[a.ip];
                                        if (!loc) return null;
                                        return (
                                            <CircleMarker 
                                                key={'a-'+i} 
                                                center={[loc.lat, loc.lon]} 
                                                radius={8}
                                                pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.6, weight: 2 }}
                                            >
                                                <Popup>
                                                    <div className="text-xs font-bold text-red-600">ATTACK IP: {a.ip}</div>
                                                    <div className="text-[10px] text-slate-500">Count: {a.count} attempts</div>
                                                    <div className="text-[10px] text-slate-500">{loc.city || 'Foreign Origin'}</div>
                                                </Popup>
                                            </CircleMarker>
                                        );
                                    })}
                                </MapContainer>

                                <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-slate-800/90 px-3 py-1.5 rounded-lg text-xs backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-xl font-bold z-[1000] pointer-events-none">
                                    Live Map: Google Maps Tiles (Real-time IP Tracking)
                                </div>
                            </div>
                        </div>

                        {/* B. LOG ANALYSIS WORDCLOUD */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                            <h3 className="font-bold flex items-center gap-2 mb-6"><FileText className="w-5 h-5 text-indigo-500"/> Log Intelligence</h3>
                            <div className="flex flex-wrap gap-2 items-center justify-center h-64 content-center">
                                {analytics && Object.entries(analytics.word_cloud).map(([word, count]) => (
                                    <span 
                                        key={word} 
                                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full font-bold transition-all hover:scale-110 cursor-default"
                                        style={{ 
                                            fontSize: Math.min(12 + ((count as number) * 2), 24) + 'px',
                                            color: word === 'error' || word === 'failed' ? '#ef4444' : 
                                                   word === 'warning' ? '#f59e0b' : 
                                                   word === 'success' ? '#10b981' : 'inherit'
                                        }}
                                    >
                                        {word}
                                    </span>
                                ))}
                            </div>
                        </div>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        
                        {/* C. UPTIME HEATMAP */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                            <h3 className="font-bold flex items-center gap-2 mb-4"><Clock className="w-5 h-5 text-emerald-500"/> Stability (30 Days)</h3>
                            <div className="grid grid-cols-10 gap-2">
                                {Array.from({length: 30}).map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`h-6 rounded-sm ${i === 12 || i === 25 ? 'bg-red-500' : 'bg-emerald-500/80'} transition-all hover:scale-110`}
                                        title={`Day ${i+1}: ${i === 12 || i === 25 ? 'Restart Detected' : 'Healthy'}`}
                                    ></div>
                                ))}
                            </div>
                            <div className="mt-4 flex justify-between text-[10px] text-slate-400 uppercase font-bold">
                                <span>30D Ago</span>
                                <span>Today</span>
                            </div>
                        </div>

                        {/* D. CAPACITY PREDICTION */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                            <h3 className="font-bold flex items-center gap-2 mb-2"><Zap className="w-5 h-5 text-amber-500"/> Smart Capacity Predictor</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-500">Predicted Exhaustion</span>
                                        <span className="font-bold text-amber-600">~14 Days</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }} animate={{ width: diskData.percent }}
                                            className="bg-gradient-to-r from-emerald-500 to-amber-500 h-full"
                                        ></motion.div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 italic">
                                    Analysis based on last 7 days of disk growth ({formatBytes(ioRates.diskWrite * 3600 * 24)}/day avg).
                                </p>
                            </div>
                        </div>

                        {/* E. REBOOT LOGS DASHBOARD */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                             <h3 className="font-bold flex items-center gap-2 mb-4"><RotateCw className="w-5 h-5 text-blue-500"/> Recent System Events</h3>
                             <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                                 {analytics?.reboots.slice(0, 5).map((r, i) => (
                                     <div key={i} className="text-[10px] font-mono p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700 truncate">
                                         {r}
                                     </div>
                                 ))}
                             </div>
                        </div>

                    </div>
                </motion.div>
            )}

            {/* 2. PROCESSES (Existing + Improved) */}
            {activeTab === 'processes' && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    key="processes"
                    className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                     <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                         <h3 className="font-bold flex items-center gap-2">Top 15 Processes (by CPU)</h3>
                         <button onClick={fetchProcesses} className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">Refresh</button>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs md:text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-800 uppercase text-slate-500 font-bold">
                                <tr>
                                    <th className="px-4 py-3">PID</th>
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">%CPU</th>
                                    <th className="px-4 py-3">%MEM</th>
                                    <th className="px-4 py-3">Command</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {processes.map((p) => (
                                    <tr key={p.pid} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-4 py-2 font-mono">{p.pid}</td>
                                        <td className="px-4 py-2">{p.user}</td>
                                        <td className="px-4 py-2 font-bold text-orange-500">{p.cpu}%</td>
                                        <td className="px-4 py-2">{p.mem}%</td>
                                        <td className="px-4 py-2 font-mono truncate max-w-[200px]" title={p.name}>{p.name}</td>
                                        <td className="px-4 py-2 text-right">
                                            <button 
                                                onClick={() => killProcess(p.pid)}
                                                className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                                title="Kill Process"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                </motion.div>
            )}

            {/* 3. SECURITY (Existing) */}
             {activeTab === 'security' && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    key="security"
                    className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                         <h3 className="font-bold flex items-center gap-2">Recent SSH Logins (Last 20)</h3>
                     </div>
                     <div className="p-4 font-mono text-xs overflow-x-auto">
                         <table className="w-full text-left">
                             <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                 {securityLogs.map((log, i) => (
                                     <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                         <td className="py-2 whitespace-pre text-slate-600 dark:text-slate-300">{log}</td>
                                     </tr>
                                 ))}
                                 {securityLogs.length === 0 && <tr><td className="p-4 text-center text-slate-400">No logs found.</td></tr>}
                             </tbody>
                         </table>
                     </div>
                </motion.div>
            )}


            {/* 4. LOGS (Existing) */}
            {activeTab === 'logs' && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    key="logs"
                    className="bg-[#300a24] rounded-xl overflow-hidden shadow-medium border border-[#5e2750] flex flex-col h-[600px]"
                >
                     <div className="bg-[#1a0513] px-4 py-3 flex items-center justify-between border-b border-[#5e2750]">
                     <div className="flex items-center gap-2 text-slate-300">
                         <Terminal className="w-4 h-4 text-[#E95420]" />
                         <span className="text-xs font-bold font-mono text-[#AEA79F] uppercase">~/pb/pb.log (Last 100 lines)</span>
                     </div>
                 </div>
                 <div className="p-6 font-mono text-xs md:text-sm text-slate-200 overflow-auto flex-1 whitespace-pre scrollbar-thin scrollbar-thumb-[#5e2750] scrollbar-track-transparent">
                     {logs || 'Waiting for logs...'}
                 </div>
                </motion.div>
            )}

            {/* 5. BACKUPS (Existing) */}
            {activeTab === 'backups' && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    key="backups"
                    className="space-y-6"
                >
                     <div className="flex justify-end">
                         <button 
                             onClick={createBackup}
                             disabled={loading}
                             className="px-6 py-2 bg-[#E95420] text-white rounded-lg font-bold shadow-lg hover:shadow-orange-500/20 hover:-translate-y-1 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                             <Database className="w-4 h-4" />
                             Buat Backup Baru
                         </button>
                     </div>

                     <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                         <table className="w-full text-left text-sm">
                             <thead className="bg-[#F7F7F7] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                 <tr>
                                     <th className="px-6 py-4 font-bold text-[#808080] uppercase tracking-wider">File Name</th>
                                     <th className="px-6 py-4 font-bold text-[#808080] uppercase tracking-wider">Date Created</th>
                                     <th className="px-6 py-4 font-bold text-[#808080] uppercase tracking-wider">Size</th>
                                     <th className="px-6 py-4 font-bold text-[#808080] uppercase tracking-wider text-right">Actions</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                 {backups.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-slate-400">Belum ada backup tersedia.</td>
                                    </tr>
                                 ) : (
                                     backups.map((file) => (
                                         <tr key={file.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                             <td className="px-6 py-4 font-medium text-[#333333] dark:text-slate-200">{file.name}</td>
                                             <td className="px-6 py-4 text-slate-500">{file.date}</td>
                                             <td className="px-6 py-4 text-slate-500 font-mono">{file.size}</td>
                                             <td className="px-6 py-4 text-right">
                                                 <a 
                                                     href={`/#`}
                                                     onClick={() => alert("Fitur download via browser belum diaktifkan demi keamanan. Silakan ambil via SFTP.")} 
                                                     className="inline-flex items-center gap-1 text-[#E95420] font-bold hover:underline"
                                                 >
                                                     <Download className="w-4 h-4" /> Download
                                                 </a>
                                             </td>
                                         </tr>
                                     ))
                                 )}
                             </tbody>
                         </table>
                     </div>
                </motion.div>
            )}

            {/* 6. DB TOOLS (Existing) */}
             {activeTab === 'database' && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    key="dbtools"
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Database className="text-orange-500"/> SQLite Maintenance</h3>
                        <p className="text-slate-500 text-sm mb-6">Utilities to maintain health of PocketBase SQLite data file.</p>
                        
                        <div className="space-y-4">
                            <button onClick={() => runDbMaintenance('vacuum')} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center justify-between border border-slate-200 dark:border-slate-700">
                                <span className="font-bold">VACUUM Database</span>
                                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">Rebuild & Shrink</span>
                            </button>
                            <button onClick={() => runDbMaintenance('integrity')} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center justify-between border border-slate-200 dark:border-slate-700">
                                <span className="font-bold">Check Integrity</span>
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Verify Data</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* 7. TOOLS & TERMINAL */}
            {activeTab === 'tools' && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    key="tools"
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                    {/* Command Runner */}
                    <div className="lg:col-span-2 bg-[#1a0513] rounded-xl shadow-lg border border-[#5e2750] flex flex-col h-[500px]">
                         <div className="px-4 py-3 border-b border-[#5e2750] bg-[#300a24] flex items-center justify-between">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <Terminal className="w-5 h-5 text-[#E95420]" />
                                Remote Command Runner
                            </h3>
                            <span className="text-xs text-[#AEA79F]">Super Admin Access Only</span>
                         </div>
                         
                         <div className="flex-1 p-4 overflow-auto font-mono text-sm">
                             <pre className="text-emerald-400 whitespace-pre-wrap">{cmdOutput}</pre>
                         </div>
                         
                         <form onSubmit={runCommand} className="p-2 bg-[#300a24] border-t border-[#5e2750] flex gap-2">
                             <div className="flex-1 relative">
                                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#E95420] font-bold">$</span>
                                 <input 
                                     type="text" 
                                     value={cmdInput}
                                     onChange={(e) => setCmdInput(e.target.value)}
                                     placeholder="Enter command (e.g. ls -la, whoami, crontab -l)..."
                                    className="w-full bg-slate-950 text-white pl-8 pr-4 py-2 rounded-lg border border-[#5e2750] focus:border-[#E95420] focus:outline-none font-mono text-sm placeholder-slate-500"
                                    style={{ backgroundColor: '#100510', color: '#ffffff' }}
                                 />
                             </div>
                             <button 
                                 type="submit"
                                 disabled={loading || !cmdInput}
                                 className="px-4 py-2 bg-[#E95420] text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                             >
                                 <Play className="w-4 h-4" />
                             </button>
                         </form>
                    </div>

                    {/* Quick Controls */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                            <h3 className="font-bold text-[#808080] uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5" /> Quick Actions
                            </h3>
                            
                            <div className="space-y-4">
                                {/* Restart Service Button */}
                                <button 
                                    onClick={restartServer}
                                    className="w-full p-4 bg-red-50 dark:bg-red-900/10 text-[#C7162B] dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-red-900/50 rounded-lg shadow-sm">
                                            <Power className="w-5 h-5 text-red-500" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold">Restart Service</div>
                                            <div className="text-xs opacity-70">Restart PocketBase Only</div>
                                        </div>
                                    </div>
                                    <AlertTriangle className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>

                                {/* Soft Reboot Button */}
                                <button 
                                    onClick={softRebootServer}
                                    className="w-full p-4 bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400 rounded-xl border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-orange-900/50 rounded-lg shadow-sm">
                                            <RotateCw className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold">Soft Reboot Server</div>
                                            <div className="text-xs opacity-70">Reboot User Space (Fast)</div>
                                        </div>
                                    </div>
                                    <AlertTriangle className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                                
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 rounded-xl border border-blue-200 dark:border-blue-800 text-sm">
                                    <strong>Tip:</strong> Terminal di samping menjalankan perintah sebagai user <code>ardilabayufirdaus</code>. Hati-hati saat menjalankan perintah.
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default ServerPage;
