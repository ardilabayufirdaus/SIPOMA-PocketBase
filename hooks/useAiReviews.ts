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
      // If no date provided, get the latest ones
      const filter = date ? `date="${date} 00:00:00"` : '';
      const records = await pb.collection('operational_ai_reviews').getFullList({
        filter: filter,
        sort: '-date',
      });
      return records as unknown as AiReview[];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};
