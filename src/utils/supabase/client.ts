import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment.");
}

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
