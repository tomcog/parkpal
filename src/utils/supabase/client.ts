import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tmrbzyrnuzwjrqvflgvb.supabase.co";
const supabaseAnonKey = "sb_publishable_2sneomY7ZPB88TkNUoc-ig_QIMpJlYY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ParkVisitRow = {
  id: string;
  user_id: string;
  park_id: string;
  visited: boolean;
  note: string;
  visited_date: string | null;
  photo_url: string | null;
  header_photo_url: string | null;
  updated_at: string;
};

export type SavedRouteRow = {
  id: string;
  user_id: string;
  name: string;
  origin: string;
  destination: string;
  encoded_polyline: string;
  distance_meters: number;
  duration_seconds: number;
  created_at: string;
};
