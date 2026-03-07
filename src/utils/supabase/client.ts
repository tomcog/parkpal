import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ymxmeaoxgucsnipxioir.supabase.co";
const supabaseAnonKey = "sb_publishable_HblkOnSQnPvK8YpZ_vjKmw_4LI-wXhQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ParkVisitRow = {
  id: string;
  user_id: string;
  park_id: string;
  visited: boolean;
  note: string;
  visited_date: string | null;
  photo_url: string | null;
  updated_at: string;
};
