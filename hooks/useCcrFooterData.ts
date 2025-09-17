import { useCallback } from "react";
import { supabase } from "../utils/supabase";

interface CcrFooterData {
  id?: string;
  date: string;
  parameter_id: string;
  plant_unit?: string;
  total: number;
  average: number;
  minimum: number;
  maximum: number;
  shift1_total: number;
  shift2_total: number;
  shift3_total: number;
  shift3_cont_total: number;
  shift1_difference: number;
  shift2_difference: number;
  shift3_difference: number;
  shift3_cont_difference: number;
}

// Interface untuk response Supabase
interface CcrFooterDataRow {
  id: string;
  date: string;
  parameter_id: string;
  plant_unit: string | null;
  total: number | null;
  average: number | null;
  minimum: number | null;
  maximum: number | null;
  shift1_total: number | null;
  shift2_total: number | null;
  shift3_total: number | null;
  shift3_cont_total: number | null;
  shift1_difference: number | null;
  shift2_difference: number | null;
  shift3_difference: number | null;
  shift3_cont_difference: number | null;
  created_at: string;
  updated_at: string;
}

export const useCcrFooterData = () => {
  const saveFooterData = useCallback(async (footerData: CcrFooterData) => {
    try {
      const { data, error } = await (supabase as any)
        .from("ccr_footer_data")
        .upsert(
          {
            date: footerData.date,
            parameter_id: footerData.parameter_id,
            plant_unit: footerData.plant_unit || "CCR",
            total: footerData.total,
            average: footerData.average,
            minimum: footerData.minimum,
            maximum: footerData.maximum,
            shift1_total: footerData.shift1_total,
            shift2_total: footerData.shift2_total,
            shift3_total: footerData.shift3_total,
            shift3_cont_total: footerData.shift3_cont_total,
            shift1_difference: footerData.shift1_difference,
            shift2_difference: footerData.shift2_difference,
            shift3_difference: footerData.shift3_difference,
            shift3_cont_difference: footerData.shift3_cont_difference,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "date,parameter_id,plant_unit",
          }
        );

      if (error) {
        console.error("Error saving CCR footer data:", error);
        throw error;
      }

      console.log("CCR footer data saved successfully:", footerData);
      return data;
    } catch (error) {
      console.error("Error in saveFooterData:", error);
      throw error;
    }
  }, []);

  const getFooterDataForDate = useCallback(
    async (date: string, plantUnit?: string) => {
      try {
        let query = (supabase as any)
          .from("ccr_footer_data")
          .select("*")
          .eq("date", date);

        if (plantUnit && plantUnit !== "all") {
          query = query.eq("plant_unit", plantUnit);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching CCR footer data:", error);
          return [];
        }

        return data || [];
      } catch (error) {
        console.error("Error in getFooterDataForDate:", error);
        return [];
      }
    },
    []
  );

  const deleteFooterData = useCallback(
    async (date: string, parameterId: string, plantUnit?: string) => {
      try {
        let query = (supabase as any)
          .from("ccr_footer_data")
          .delete()
          .eq("date", date)
          .eq("parameter_id", parameterId);

        if (plantUnit) {
          query = query.eq("plant_unit", plantUnit);
        }

        const { error } = await query;

        if (error) {
          console.error("Error deleting CCR footer data:", error);
          throw error;
        }

        console.log("CCR footer data deleted successfully");
      } catch (error) {
        console.error("Error in deleteFooterData:", error);
        throw error;
      }
    },
    []
  );

  return {
    saveFooterData,
    getFooterDataForDate,
    deleteFooterData,
  };
};
