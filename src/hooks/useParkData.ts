import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../utils/supabase/client";

export interface ParkData {
  visited: boolean;
  note: string;
  visitedDate?: string;
  photoUrl?: string;
}

interface UseParkDataParams {
  active: boolean;
  user: User | null;
  isGuest: boolean;
}

export function useParkData({ active, user, isGuest }: UseParkDataParams) {
  const [parkData, setParkData] = useState<Map<string, ParkData>>(new Map());
  const [headerImageOverrides, setHeaderImageOverrides] = useState<Map<string, string>>(() => {
    try {
      const stored = localStorage.getItem("parkpal_header_images");
      return stored ? new Map(Object.entries(JSON.parse(stored))) : new Map();
    } catch { return new Map(); }
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;

    const load = async () => {
      setDataLoading(true);

      if (user) {
        const { data, error } = await supabase
          .from("park_visits")
          .select("park_id, visited, note, visited_date, photo_url, header_photo_url")
          .eq("user_id", user.id);

        if (error) {
          console.error("Supabase load error:", error);
          setSaveError(`Failed to load your data: ${error.message}`);
        } else if (data) {
          const map = new Map<string, ParkData>();
          const headerOverrides = new Map<string, string>();
          for (const row of data) {
            if (row.visited) {
              map.set(row.park_id, {
                visited: row.visited,
                note: row.note ?? "",
                visitedDate: row.visited_date ?? undefined,
                photoUrl: row.photo_url ?? undefined,
              });
            }
            if (row.header_photo_url) {
              headerOverrides.set(row.park_id, row.header_photo_url);
            }
          }
          setParkData(map);
          setHeaderImageOverrides(headerOverrides);
        }
      } else {
        const local = localStorage.getItem("parkData_guest");
        if (local) {
          try {
            setParkData(new Map(Object.entries(JSON.parse(local))));
          } catch { /* ignore */ }
        }
      }

      setDataLoading(false);
    };

    load();
  }, [active, user]);

  useEffect(() => {
    if (!isGuest || dataLoading) return;
    localStorage.setItem("parkData_guest", JSON.stringify(Object.fromEntries(parkData)));
  }, [parkData, isGuest, dataLoading]);

  useEffect(() => {
    localStorage.setItem("parkpal_header_images", JSON.stringify(Object.fromEntries(headerImageOverrides)));
  }, [headerImageOverrides]);

  const upsertPark = useCallback(async (parkId: string, data: ParkData) => {
    if (!user) return;
    const { error } = await supabase.from("park_visits").upsert({
      user_id: user.id,
      park_id: parkId,
      visited: data.visited,
      note: data.note,
      visited_date: data.visitedDate ?? null,
      photo_url: data.photoUrl || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,park_id" });
    if (error) {
      console.error("Supabase upsert error:", error);
      setSaveError(`Failed to save: ${error.message}`);
    }
  }, [user]);

  const toggleVisited = useCallback(async (parkId: string) => {
    const current = parkData.get(parkId);
    if (current?.visited) {
      setParkData((prev) => { const next = new Map(prev); next.delete(parkId); return next; });
      if (user) {
        const { error } = await supabase.from("park_visits").delete().match({ user_id: user.id, park_id: parkId });
        if (error) {
          console.error("Supabase delete error:", error);
          setSaveError(`Failed to save: ${error.message}`);
        }
      }
    } else {
      const updated: ParkData = { visited: true, note: current?.note ?? "", visitedDate: current?.visitedDate };
      setParkData((prev) => { const next = new Map(prev); next.set(parkId, updated); return next; });
      upsertPark(parkId, updated);
    }
  }, [user, parkData, upsertPark]);

  const updateParkNote = useCallback((parkId: string, note: string) => {
    const current = parkData.get(parkId);
    if (!current?.visited) return;
    const updated = { ...current, note };
    setParkData((prev) => { const next = new Map(prev); next.set(parkId, updated); return next; });
    upsertPark(parkId, updated);
  }, [parkData, upsertPark]);

  const updateParkDate = useCallback((parkId: string, date: string) => {
    const current = parkData.get(parkId);
    if (!current?.visited) return;
    const updated = { ...current, visitedDate: date };
    setParkData((prev) => { const next = new Map(prev); next.set(parkId, updated); return next; });
    upsertPark(parkId, updated);
  }, [parkData, upsertPark]);

  const updateParkPhoto = useCallback((parkId: string, photoUrl: string) => {
    const current = parkData.get(parkId);
    if (!current?.visited) return;
    const updated = { ...current, photoUrl: photoUrl || undefined };
    setParkData((prev) => { const next = new Map(prev); next.set(parkId, updated); return next; });
    upsertPark(parkId, updated);
  }, [parkData, upsertPark]);

  const upsertHeaderImage = useCallback(async (parkId: string, url: string) => {
    if (!user) return;
    const { error } = await supabase.from("park_visits").upsert({
      user_id: user.id,
      park_id: parkId,
      header_photo_url: url,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,park_id" });
    if (error) {
      console.error("Header image upsert error:", error);
      setSaveError(`Failed to save header image: ${error.message}`);
    }
  }, [user]);

  const updateHeaderImage = useCallback((parkId: string, url: string) => {
    setHeaderImageOverrides((prev) => { const next = new Map(prev); next.set(parkId, url); return next; });
    upsertHeaderImage(parkId, url);
  }, [upsertHeaderImage]);

  const resetParkData = useCallback(() => setParkData(new Map()), []);
  const clearSaveError = useCallback(() => setSaveError(null), []);

  return {
    parkData,
    headerImageOverrides,
    dataLoading,
    saveError,
    toggleVisited,
    updateParkNote,
    updateParkDate,
    updateParkPhoto,
    updateHeaderImage,
    resetParkData,
    clearSaveError,
  };
}
