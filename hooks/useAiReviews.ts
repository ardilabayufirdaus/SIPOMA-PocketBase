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
        // Find the latest available date first from the collection
        const latest = await pb.collection('operational_ai_reviews').getList(1, 1, {
          sort: '-date',
        });

        if (latest.items.length === 0) return [];

        // PocketBase usually returns date as "YYYY-MM-DD HH:MM:SS.mmmZ"
        targetDate = latest.items[0].date.split(' ')[0];
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
