import { AlertSeverity } from "../types";
import { supabase } from "../utils/supabase";

// Function untuk membuat notifikasi demo
export const createDemoNotifications = async () => {
  const demoNotifications = [
    {
      message: "System maintenance will begin in 30 minutes",
      severity: AlertSeverity.WARNING,
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      message: "New user John Doe has been registered",
      severity: AlertSeverity.INFO,
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      read: false,
    },
    {
      message: "Critical: Temperature sensor in Unit 1 is malfunctioning",
      severity: AlertSeverity.CRITICAL,
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      read: false,
    },
    {
      message: "Production target for today has been achieved",
      severity: AlertSeverity.INFO,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      read: true,
    },
    {
      message: "Backup process completed successfully",
      severity: AlertSeverity.INFO,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      read: true,
    },
  ];

  try {
    const { error } = await supabase.from("alerts").insert(demoNotifications);

    if (error) {
      console.error("Error creating demo notifications:", error);
    } else {
      console.log("Demo notifications created successfully");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

// Function untuk membersihkan notifikasi demo
export const clearDemoNotifications = async () => {
  try {
    const { error } = await supabase
      .from("alerts")
      .delete()
      .or(
        `message.ilike.%maintenance%,message.ilike.%John Doe%,message.ilike.%temperature sensor%,message.ilike.%production target%,message.ilike.%backup process%`
      );

    if (error) {
      console.error("Error clearing demo notifications:", error);
    } else {
      console.log("Demo notifications cleared successfully");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};
