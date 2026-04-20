import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../utils/supabase/client";

export type AuthState = "loading" | "auth-screen" | "app";

const GUEST_KEY = "parkpal_guest_mode";

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setAuthState("app");
      } else if (localStorage.getItem(GUEST_KEY)) {
        setIsGuest(true);
        setAuthState("app");
      } else {
        setAuthState("auth-screen");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsGuest(false);
        setAuthState("app");
      } else if (!localStorage.getItem(GUEST_KEY)) {
        setUser(null);
        setAuthState("auth-screen");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const continueAsGuest = () => {
    localStorage.setItem(GUEST_KEY, "1");
    setIsGuest(true);
    setAuthState("app");
  };

  const signOut = async () => {
    localStorage.removeItem(GUEST_KEY);
    setIsGuest(false);
    if (user) {
      await supabase.auth.signOut();
    } else {
      setAuthState("auth-screen");
    }
  };

  // Navigate to auth screen without clearing guest state or local data.
  const goToAuthScreen = () => setAuthState("auth-screen");

  return { authState, user, isGuest, continueAsGuest, signOut, goToAuthScreen };
}
