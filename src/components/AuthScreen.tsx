import { useState } from "react";
import { supabase } from "../utils/supabase/client";
import NounNationalPark from "../imports/NounNationalPark19895091";
import { LogIn, UserPlus } from "lucide-react";
import { Button, InputText } from "@tomcoggia/ui";

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
    <div className="min-h-screen bg-[color-mix(in_srgb,var(--ui-brand)_8%,white)] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[360px] flex flex-col gap-8">

        {/* Logo + tagline */}
        <div className="flex flex-col items-center gap-5">
          <div className="h-[91px] w-full flex justify-center">
            <NounNationalPark />
          </div>
          <p className="text-[#717182] text-[20px] text-center leading-[20px]">
            Discover{" "}
            <span className="font-bold text-ui-brand">Your</span>
            {" "}National Parks
          </p>
        </div>

        {/* Auth card */}
        <form
          onSubmit={handleSubmit}
          className="bg-[color-mix(in_srgb,var(--ui-brand)_20%,white)] rounded-[12px] p-5 flex flex-col gap-[19px]"
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

          <InputText
            type="email"
            label="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <InputText
            type="password"
            label="Password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            size="lg"
            loading={loading}
            icon={mode === "signin" ? <LogIn /> : <UserPlus />}
            className="w-full"
          >
            {mode === "signin" ? "Sign in" : "Sign up"}
          </Button>

          <Button
            variant="tertiary"
            size="lg"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setSuccessMsg(null);
            }}
            className="w-full"
          >
            {mode === "signin"
              ? "Need an account? Sign up"
              : "Already have an account? Sign in"}
          </Button>
        </form>

        {/* Guest mode */}
        <Button variant="tertiary" size="lg" onClick={onContinueAsGuest} className="w-full">
          Use without signing in
        </Button>
      </div>
    </div>
  );
}
