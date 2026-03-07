import { useState } from "react";
import { supabase } from "../utils/supabase/client";
import NounNationalPark from "../imports/NounNationalPark19895091";
import { LogIn, UserPlus, Loader2 } from "lucide-react";

interface AuthScreenProps {
  onContinueAsGuest: () => void;
}

export default function AuthScreen({ onContinueAsGuest }: AuthScreenProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMsg("Check your email to confirm your account, then sign in.");
        setMode("signin");
        setPassword("");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0ffed] flex flex-col items-center justify-center px-4">
      <div className="w-[360px] flex flex-col gap-8">

        {/* Logo + tagline */}
        <div className="flex flex-col items-center gap-5">
          <div className="h-[91px] w-full flex justify-center">
            <NounNationalPark />
          </div>
          <p className="text-[#717182] text-[20px] text-center leading-[20px]">
            Discover{" "}
            <span className="font-bold text-[#30bf17]">Your</span>
            {" "}National Parks
          </p>
        </div>

        {/* Auth card */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#d4f7cd] rounded-[12px] p-5 flex flex-col gap-[19px]"
        >
          {error && (
            <p className="text-red-600 text-sm text-center bg-red-50 rounded-[4px] px-3 py-2">
              {error}
            </p>
          )}
          {successMsg && (
            <p className="text-green-700 text-sm text-center bg-green-50 rounded-[4px] px-3 py-2">
              {successMsg}
            </p>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white h-[44px] rounded-[4px] px-4 py-3 text-[18px] text-[#888] placeholder:text-[#888] outline-none focus:ring-2 focus:ring-[#30bf17]/40 w-full"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-white h-[44px] rounded-[4px] px-4 py-3 text-[18px] text-[#888] placeholder:text-[#888] outline-none focus:ring-2 focus:ring-[#30bf17]/40 w-full"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-[#30bf17] h-[44px] rounded-[4px] flex items-center justify-center gap-2 text-white font-semibold text-[18px] w-full disabled:opacity-70 hover:bg-[#28a813] transition-colors"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === "signin" ? (
              <LogIn className="w-5 h-5" />
            ) : (
              <UserPlus className="w-5 h-5" />
            )}
            {mode === "signin" ? "Sign in" : "Sign up"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setSuccessMsg(null);
            }}
            className="h-[44px] flex items-center justify-center text-[#30bf17] font-medium text-[18px] text-center w-full hover:text-[#28a813] transition-colors"
          >
            {mode === "signin"
              ? "Need an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </form>

        {/* Guest mode */}
        <button
          onClick={onContinueAsGuest}
          className="h-[46px] flex items-center justify-center text-[#30bf17] font-medium text-[18px] text-center w-full hover:text-[#28a813] transition-colors"
        >
          Use without signing in
        </button>
      </div>
    </div>
  );
}
