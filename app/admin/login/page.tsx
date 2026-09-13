"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("admin-login", { password, redirect: false });

    setLoading(false);

    if (res?.error) {
      setError("Incorrect password");
      return;
    }

    router.push("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-pitch-gradient px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <h1 className="font-display text-2xl font-bold text-mist text-center">
          Coach Login
        </h1>
        <input
          required
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border-0 border-b border-sky/25 bg-transparent pb-2.5 font-body text-mist outline-none focus:border-ocean"
        />
        {error && <p className="font-body text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-ocean py-3 font-body text-sm font-medium text-white transition hover:bg-[#0299d1] disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>
    </div>
  );
}
