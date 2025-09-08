import { useCallback } from "react";
import { CcrSiloData } from "../types";
import { useSiloCapacities } from "./useSiloCapacities";
import { supabase } from "../utils/supabase";

export const useCcrSiloData = () => {
  // Fungsi untuk menghapus data silo di Supabase
  const deleteSiloData = useCallback(async (date: string, siloId: string) => {
    // Enhanced validation for date parameter
    if (
      !date ||
      typeof date !== "string" ||
      date.trim() === "" ||
      date === "undefined" ||
      date === "null"
    ) {
      console.error("Invalid date provided to deleteSiloData:", date);
      return;
    }

    const { error } = await supabase
      .from("ccr_silo_data")
      .delete()
      .eq("date", date)
      .eq("silo_id", siloId);
    if (error) {
      console.error("Error deleting CCR silo data:", error);
    }
  }, []);
  const { records: silos, loading: silosLoading } = useSiloCapacities();

  const getDataForDate = useCallback(
    async (date: string): Promise<CcrSiloData[]> => {
      // Enhanced validation for date parameter
      if (
        silosLoading ||
        silos.length === 0 ||
        !date ||
        typeof date !== "string" ||
        date.trim() === "" ||
        date === "undefined" ||
        date === "null"
      ) {
        return [];
      }

      const { data, error } = await supabase
        .from("ccr_silo_data")
        .select("*")
        .eq("date", date);

      if (error) {
        console.error("Error fetching CCR silo data:", error);
        return [];
      }

      // FIX: Map supabase camelCase response to application's snake_case type
      const supabaseData = (data || []) as any[];
      const dailyRecords = new Map(supabaseData.map((d) => [d.silo_id, d]));

      return silos
        .map((silo) => {
          const record = dailyRecords.get(silo.id);
          if (record) {
            return {
              id: record.id,
              silo_id: record.silo_id,
              date: record.date,
              shift1: record.shift1,
              shift2: record.shift2,
              shift3: record.shift3,
            } as CcrSiloData;
          }
          return {
            id: `${silo.id}-${date}`,
            silo_id: silo.id,
            date: date,
            shift1: {},
            shift2: {},
            shift3: {},
          };
        })
        .sort((a, b) => {
          // FIX: Use snake_case properties to match the CcrSiloData type and SiloCapacity type
          const siloA = silos.find((s) => s.id === a.silo_id);
          const siloB = silos.find((s) => s.id === b.silo_id);
          return (siloA?.silo_name || "").localeCompare(siloB?.silo_name || "");
        });
    },
    [silos, silosLoading]
  );

  const updateSiloData = useCallback(
    async (
      date: string,
      siloId: string,
      shift: "shift1" | "shift2" | "shift3",
      field: "emptySpace" | "content",
      value: number | undefined
    ) => {
      // Enhanced validation for date parameter
      if (
        !date ||
        typeof date !== "string" ||
        date.trim() === "" ||
        date === "undefined" ||
        date === "null"
      ) {
        console.error("Invalid date provided to updateSiloData:", date);
        return;
      }

      const { data: existing, error: fetchError } = await supabase
        .from("ccr_silo_data")
        .select("*")
        .eq("date", date)
        .eq("silo_id", siloId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        // Ignore 'exact one row' error for upsert case
        console.error("Error fetching existing silo data", fetchError);
        return;
      }

      const currentShiftData =
        typeof existing?.[shift] === "object" && existing?.[shift] !== null
          ? existing[shift]
          : {};
      const updatedShiftData = {
        ...currentShiftData,
        [field]: value,
      };

      // Gabungkan data shift
      const shift1 =
        shift === "shift1" ? updatedShiftData : existing?.shift1 ?? {};
      const shift2 =
        shift === "shift2" ? updatedShiftData : existing?.shift2 ?? {};
      const shift3 =
        shift === "shift3" ? updatedShiftData : existing?.shift3 ?? {};

      // Cek apakah semua field shift kosong
      const isEmpty = [shift1, shift2, shift3].every((s) => {
        if (typeof s === "object" && s !== null && !Array.isArray(s)) {
          // akses properti hanya jika objek biasa
          return (
            (s["emptySpace"] === undefined ||
              s["emptySpace"] === null ||
              s["emptySpace"] === "") &&
            (s["content"] === undefined ||
              s["content"] === null ||
              s["content"] === "")
          );
        }
        // Jika array atau tipe lain, anggap kosong
        return true;
      });

      if (isEmpty) {
        // Hapus data di Supabase
        await supabase
          .from("ccr_silo_data")
          .delete()
          .eq("date", date)
          .eq("silo_id", siloId);
        return;
      }

      // Build upsertData untuk update/replace
      const upsertData = {
        id: existing?.id ?? `${siloId}_${date}`,
        silo_id: siloId,
        date,
        shift1,
        shift2,
        shift3,
      };

      const { error } = await supabase
        .from("ccr_silo_data")
        .upsert(upsertData as any, { onConflict: "date,silo_id" });

      if (error) {
        console.error("Error updating CCR silo data:", error);
      }
    },
    []
  );

  return {
    getDataForDate,
    updateSiloData,
    deleteSiloData,
    loading: silosLoading,
  };
};
