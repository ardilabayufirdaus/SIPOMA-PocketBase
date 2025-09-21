import { AlertSeverity } from '../types';
import { supabase } from '../utils/supabase';

// Function untuk membuat notifikasi demo
export const createDemoNotifications = async () => {
  const demoNotifications = [
    {
      message: 'System maintenance will begin in 30 minutes',
      severity: 'Warning',
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      message: 'New user John Doe has been registered',
      severity: 'Info',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      read: false,
    },
    {
      message: 'Critical: Temperature sensor in Unit 1 is malfunctioning',
      severity: 'Critical',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      read: false,
    },
    {
      message: 'Production target for today has been achieved',
      severity: 'Info',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      read: true,
    },
    {
      message: 'Backup process completed successfully',
      severity: 'Info',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      read: true,
    },
  ];

  try {
    const { error } = await supabase.from('alerts').insert(demoNotifications as any);

    if (error) {
      console.error('Error creating demo notifications:', error);
    } else {
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Function untuk membersihkan notifikasi demo
export const clearDemoNotifications = async () => {
  try {
    const { error } = await supabase
      .from('alerts')
      .delete()
      .or(
        `message.ilike.%maintenance%,message.ilike.%John Doe%,message.ilike.%temperature sensor%,message.ilike.%production target%,message.ilike.%backup process%`
      );

    if (error) {
      console.error('Error clearing demo notifications:', error);
    } else {
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
