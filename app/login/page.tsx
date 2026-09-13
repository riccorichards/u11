"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dbLogo from "../../assets/dblogo.png";

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("player-code", { code, redirect: false });

    setLoading(false);

    if (res?.error) {
      setError("That code doesn't match any player");
      return;
    }

    router.push("/home");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-pitch-gradient px-6">
      <div className="w-full max-w-sm animate-fadeUp text-center">
        <Image
          src={dbLogo}
          alt="Dinamo Batumi crest"
          width={72}
          height={72}
          className="mx-auto mb-6"
          priority
        />
        <h1 className="font-display text-5xl font-extrabold tracking-tight text-mist">
          Dinamo Batumi U11
        </h1>
        <p className="mt-2 font-body text-sm text-sky">
          Player &amp; family portal
        </p>

        <form onSubmit={handleSubmit} className="mt-10 text-left">
          <label className="font-body text-xs text-sky">Your player code</label>
          <input
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            className="mt-1.5 w-full border-0 border-b border-sky/25 bg-transparent pb-2.5 font-mono text-lg uppercase tracking-widest text-mist placeholder:text-sky/40 outline-none focus:border-ocean"
          />

          {error && (
            <p className="mt-3 font-body text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-md bg-ocean py-3 font-body text-sm font-medium text-white transition hover:bg-[#0299d1] disabled:opacity-60"
          >
            {loading ? "Checking…" : "Enter"}
          </button>
        </form>

        <a
          href="/admin/login"
          className="mt-6 block font-body text-xs text-sky/50 hover:text-sky/80"
        >
          Coach login
        </a>
      </div>
    </div>
  );
}
