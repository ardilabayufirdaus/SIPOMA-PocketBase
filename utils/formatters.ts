// Function to format date to DD/MM/YYYY
export const formatDate = (dateInput: Date | string): string => {
  const date = new Date(dateInput);
  // Adjust for timezone offset to prevent day-before issues
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const correctedDate = new Date(date.getTime() + userTimezoneOffset);

  const day = String(correctedDate.getDate()).padStart(2, "0");
  const month = String(correctedDate.getMonth() + 1).padStart(2, "0");
  const year = correctedDate.getFullYear();

  return `${day}/${month}/${year}`;
};

// Function to format number with dot as thousand separator and 2 decimal places
export const formatNumber = (num: number): string => {
  if (num === null || num === undefined) {
    return "0.00";
  }

  // Format to 2 decimal places and use dot as thousand separator
  const formatted = num.toFixed(2);
  const parts = formatted.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return parts.join(",");
};

// Calculates duration between two HH:MM time strings
export const calculateDuration = (
  startTime: string,
  endTime: string
): { hours: number; minutes: number } => {
  if (!startTime || !endTime) return { hours: 0, minutes: 0 };

  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  let start = new Date(0, 0, 0, startHours, startMinutes);
  let end = new Date(0, 0, 0, endHours, endMinutes);

  // Handle overnight duration
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }

  const diffMs = end.getTime() - start.getTime();
  const totalMinutes = Math.floor(diffMs / 60000);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return { hours, minutes };
};

export const formatDuration = (hours: number, minutes: number): string => {
  let result = "";
  if (hours > 0) {
    result += `${hours}h `;
  }
  result += `${minutes}m`;
  return result.trim();
};

export const formatTimeSince = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return `${Math.floor(interval)}y ago`;
  interval = seconds / 2592000;
  if (interval > 1) return `${Math.floor(interval)}mo ago`;
  interval = seconds / 86400;
  if (interval > 1) return `${Math.floor(interval)}d ago`;
  interval = seconds / 3600;
  if (interval > 1) return `${Math.floor(interval)}h ago`;
  interval = seconds / 60;
  if (interval > 1) return `${Math.floor(interval)}m ago`;
  return `${Math.floor(seconds)}s ago`;
};

// Function to format currency in Indonesian Rupiah
export const formatRupiah = (amount: number): string => {
  if (amount === null || amount === undefined) {
    return "Rp 0";
  }

  // Format number with dot as thousand separator
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `Rp ${formatted}`;
};

// Function to format budget in millions for compact display
export const formatBudgetCompact = (amount: number): string => {
  if (amount === null || amount === undefined) {
    return "Rp 0";
  }

  if (amount >= 1000000000) {
    return `Rp ${(amount / 1000000000).toFixed(1)}M`;
  } else if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(1)}jt`;
  } else if (amount >= 1000) {
    return `Rp ${(amount / 1000).toFixed(0)}rb`;
  } else {
    return `Rp ${Math.round(amount)}`;
  }
};
