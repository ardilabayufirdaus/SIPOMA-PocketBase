import { useQuery } from '@tanstack/react-query';
import { pb } from '../utils/pocketbase-simple';

export interface AiReview {
  id: string;
  date: string;
  plant_unit: string;
  review_content: string;
  recommendations: string;
  metrics_summary: {
    total_production: number;
    downtime_hours: number;
    efficiency_score: number;
  };
}

export const useAiReviews = (date?: string) => {
  return useQuery({
    queryKey: ['ai-reviews', date],
    queryFn: async (): Promise<AiReview[]> => {
      let targetDate = date;

      if (!targetDate) {
        // Calculate H-1 (Yesterday) based on current system time
        const date = new Date();
        date.setDate(date.getDate() - 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        targetDate = `${year}-${month}-${day}`;
      }

      // Filter specifically for that target date (using prefix match for robustness)
      const filter = `date >= "${targetDate} 00:00:00" && date <= "${targetDate} 23:59:59"`;
      const records = await pb.collection('operational_ai_reviews').getFullList({
        filter: filter,
        sort: 'plant_unit', // Sort by unit name for consistent carousel order
      });

      return records as unknown as AiReview[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });
};
