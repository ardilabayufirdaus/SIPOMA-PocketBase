import { useState, useCallback, useEffect } from 'react';
import { Machine, Kpi, Alert, MachineStatus } from '../types';
import { supabase } from '../utils/supabase';
import FireIcon from '../components/icons/FireIcon';
import ChartBarIcon from '../components/icons/ChartBarIcon';
import ArchiveBoxIcon from '../components/icons/ArchiveBoxIcon';
import CogIcon from '../components/icons/CogIcon';

// Helper to map icon names from DB to components
const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  FireIcon: FireIcon,
  CogIcon: CogIcon,
  ArchiveBoxIcon: ArchiveBoxIcon,
  ChartBarIcon: ChartBarIcon,
};

export const usePlantData = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [productionData, setProductionData] = useState<{ hour: number; output: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [machinesRes, kpisRes, alertsRes, productionRes] = await Promise.all([
      supabase.from('machines').select('*'),
      supabase.from('kpis').select('*'),
      supabase.from('alerts').select('*').order('timestamp', { ascending: false }),
      supabase.from('production_data').select('*').limit(24).order('hour', { ascending: false }), // Assuming last 24h data
    ]);

    if (machinesRes.error) {
      console.error('Error fetching machines:', machinesRes.error);
      setMachines([]);
    } else {
      // Map the data to ensure proper typing
      const mappedMachines = (machinesRes.data || []).map((machine: any) => ({
        ...machine,
        status: machine.status || MachineStatus.STOPPED, // Ensure valid status
      }));
      setMachines(mappedMachines);
    }

    if (kpisRes.error) {
      console.error('Error fetching KPIs:', kpisRes.error);
      setKpis([]);
    } else {
      const kpisWithIcons = (kpisRes.data || []).map((kpi) => ({
        ...kpi,
        icon: iconMap[kpi.icon as string] || CogIcon, // Fallback icon
      }));
      setKpis(kpisWithIcons as any[]);
    }

    if (alertsRes.error) {
      console.error('Error fetching alerts:', alertsRes.error);
      setAlerts([]);
    } else {
      const parsedAlerts = (alertsRes.data || []).map((alert) => ({
        ...alert,
        timestamp: new Date(alert.timestamp),
      }));
      setAlerts(parsedAlerts as any[]);
    }

    if (productionRes.error) {
      console.error('Error fetching production data:', productionRes.error);
      setProductionData([]);
    } else {
      setProductionData(productionRes.data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleMachineStatus = useCallback(
    async (machineId: string) => {
      const machine = machines.find((m) => m.id === machineId);
      if (!machine) return;

      const { error } = await supabase
        .from('machines')
        .update({
          status: machine.status === 'Running' ? 'Stopped' : 'Running',
        })
        .eq('id', machineId);

      if (error) console.error('Error toggling machine status:', error);
      else fetchData(); // Refetch to get consistent state
    },
    [machines, fetchData]
  );

  const markAllAlertsAsRead = useCallback(async () => {
    const unreadAlertIds = alerts.filter((a) => !a.read).map((a) => a.id);
    if (unreadAlertIds.length === 0) return;

    const { error } = await supabase.from('alerts').update({ read: true }).in('id', unreadAlertIds);

    if (error) console.error('Error marking alerts as read:', error);
    else fetchData();
  }, [alerts, fetchData]);

  return {
    machines,
    kpis,
    alerts,
    productionData,
    loading,
    toggleMachineStatus,
    markAllAlertsAsRead,
  };
};
