"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PlayerAvatar } from "@/components/admin/PlayerAvatar";
import Link from "next/link";

const POSITIONS = ["GK", "DEF", "MID", "FWD"] as const;

const TARGET_FIELDS: { key: string; label: string; suffix?: string }[] = [
  { key: "prsAvg", label: "ვარჯიშისთვის მზაობა (საშ. PRS)", suffix: "%" },
  { key: "avgRating", label: "მატჩის საშუალო შეფასება", suffix: "/10" },
  { key: "attendanceRate", label: "დასწრების პროცენტი", suffix: "%" },
  { key: "consistencyScore", label: "სტაბილურობის მაჩვენებელი", suffix: "%" },
  { key: "disciplineScore", label: "დისციპლინის ქულა", suffix: "%" },
  {
    key: "pillarOverall",
    label: "ძირითადი უნარების საერთო ქულა",
    suffix: "/10",
  },
];

export default function PlayerProfileEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [player, setPlayer] = useState<any>(null);
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [regenerating, setRegenerating] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [challenges, setChallenges] = useState<any[]>([]);
  const [showChallengeForm, setShowChallengeForm] = useState(false);

  async function loadChallenges() {
    const res = await fetch(`/api/challenges?playerId=${id}`);
    setChallenges(await res.json());
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [pRes, kRes] = await Promise.all([
        fetch(`/api/players/${id}`),
        fetch(`/api/kpi?playerId=${id}`),
      ]);
      const { player: playerData } = await pRes.json();
      const k = await kRes.json();

      setPlayer(playerData);

      const t: Record<string, string> = {};
      for (const field of TARGET_FIELDS) {
        t[field.key] =
          k.targets?.[field.key] != null ? String(k.targets[field.key]) : "";
      }
      setTargets(t);
      setLoading(false);
    }
    load();
    loadChallenges();
  }, [id]);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    let avatarUrl = player.avatarUrl;
    if (photoFile) {
      const form = new FormData();
      form.append("file", photoFile);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
      if (uploadRes.ok) avatarUrl = (await uploadRes.json()).url;
    }

    await fetch(`/api/players/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...player, avatarUrl }),
    });
    setPlayer({ ...player, avatarUrl });

    const numericTargets: Record<string, number> = {};
    for (const [key, val] of Object.entries(targets)) {
      if (val !== "") numericTargets[key] = Number(val);
    }
    await fetch(`/api/kpi`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: id, targets: numericTargets }),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleRegenerateCode() {
    setRegenerating(true);
    const res = await fetch(`/api/players/${id}/regenerate-code`, {
      method: "POST",
    });
    if (res.ok) {
      const updated = await res.json();
      setPlayer((prev: any) => ({
        ...prev,
        inviteCode: updated.inviteCode,
        inviteCodeClaimed: false,
      }));
    }
    setRegenerating(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch("/api/players", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: id }),
    });
    if (res.ok) {
      router.push("/admin/players");
    } else {
      setDeleting(false);
    }
  }

  async function handleLogAttempt(challengeId: string, success: boolean) {
    await fetch(`/api/challenges/${challengeId}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success }),
    });
    loadChallenges();
  }

  if (loading || !player) {
    return <p className="p-6 font-body text-sm text-sky/60">იტვირთება…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <button
        onClick={() => router.push("/admin/players")}
        className="mb-6 font-body text-sm text-sky/70 hover:text-mist"
      >
        ← მოთამაშეთა სიაში დაბრუნება
      </button>
      <Link
        href={`/admin/players/${id}/view`}
        className="mb-6 ml-3 inline-block font-body text-sm text-ocean hover:underline"
      >
        👁 ნახვა მოთამაშის თვალით
      </Link>
      <div className="flex items-center gap-4">
        <label className="cursor-pointer">
          <PlayerAvatar
            name={player.name}
            surname={player.surname}
            avatarUrl={photoPreview ?? player.avatarUrl}
            size={64}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </label>
        <div>
          <h1 className="font-display text-3xl font-extrabold text-mist">
            {player.name} {player.surname}
          </h1>
          <p className="font-body text-sm text-sky/60">
            #{player.number} · {player.position}
          </p>
        </div>
      </div>

      {/* Basic info */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-mist">
          ძირითადი ინფორმაცია
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="font-body text-xs text-sky">სახელი</label>
            <input
              value={player.name}
              onChange={(e) => setPlayer({ ...player, name: e.target.value })}
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-mist outline-none focus:border-ocean"
            />
          </div>
          <div>
            <label className="font-body text-xs text-sky">გვარი</label>
            <input
              value={player.surname}
              onChange={(e) =>
                setPlayer({ ...player, surname: e.target.value })
              }
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-mist outline-none focus:border-ocean"
            />
          </div>
          <div>
            <label className="font-body text-xs text-sky">
              ნომერი მაისურზე
            </label>
            <input
              type="number"
              value={player.number}
              onChange={(e) =>
                setPlayer({ ...player, number: Number(e.target.value) })
              }
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-mist outline-none focus:border-ocean"
            />
          </div>
          <div>
            <label className="font-body text-xs text-sky">
              პოზიცია / ამპლუა
            </label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {POSITIONS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setPlayer({ ...player, position: pos })}
                  className={`rounded-md border py-1.5 font-body text-sm transition ${
                    player.position === pos
                      ? "border-ocean bg-ocean/20 text-mist"
                      : "border-sky/15 text-sky/60 hover:border-sky/40"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* IDP Targets */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-mist">
          ინდივიდუალური განვითარების მიზნები (IDP)
        </h2>
        <p className="mt-1 font-body text-xs text-sky/60">
          დატოვეთ ველი ცარიელი, თუ ამ მეტრიკას კონკრეტული მოთამაშისთვის ჯერ არ
          აკონტროლებთ.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {TARGET_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="font-body text-xs text-sky">
                {field.label}
              </label>
              <div className="mt-1 flex items-center border-b border-sky/25 focus-within:border-ocean">
                <input
                  type="number"
                  step="0.1"
                  value={targets[field.key] ?? ""}
                  onChange={(e) =>
                    setTargets({ ...targets, [field.key]: e.target.value })
                  }
                  className="w-full bg-transparent pb-2 font-body text-mist outline-none"
                />
                {field.suffix && (
                  <span className="pb-2 font-body text-xs text-sky/50">
                    {field.suffix}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Coach notes */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-mist">
          მწვრთნელის შენიშვნები
        </h2>
        <p className="mt-1 font-body text-xs text-sky/60">
          ტაქტიკური სირთულეები, განვითარების ფოკუსი — ხილვადია მხოლოდ
          სამწვრთნელო შტაბისთვის.
        </p>
        <textarea
          rows={4}
          value={player.developmentNotes ?? ""}
          onChange={(e) =>
            setPlayer({ ...player, developmentNotes: e.target.value })
          }
          placeholder="მაგ. უჭირს სივრცის შემოწმება (Scanning) ბრმა ზონიდან პრესინგის დროს"
          className="mt-3 w-full rounded-md border border-sky/15 bg-white/[0.02] p-3 font-body text-sm text-mist outline-none focus:border-ocean"
        />
      </section>

      {/* Challenges */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-mist">
            გამოწვევები
          </h2>
          <button
            onClick={() => setShowChallengeForm(true)}
            className="rounded-md bg-ocean px-3 py-1.5 font-body text-xs font-medium text-white"
          >
            + ახალი გამოწვევა
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {challenges.map((c) => (
            <div
              key={c._id}
              className="rounded-lg border border-sky/10 bg-white/[0.02] p-3"
            >
              <div className="flex items-center justify-between">
                <p className="font-body text-sm text-mist">{c.title}</p>
                <span className="font-mono text-xs text-sky/60">
                  {c.progressCount}/{c.targetCount} ·{" "}
                  {c.status === "active" ? "აქტიური" : c.status}
                </span>
              </div>
              {c.status === "active" && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleLogAttempt(c._id, true)}
                    className="rounded-md bg-[#1FA97A]/20 px-3 py-1 font-body text-xs text-[#1FA97A]"
                  >
                    ✓ ჩაეთვალა
                  </button>
                  <button
                    onClick={() => handleLogAttempt(c._id, false)}
                    className="rounded-md bg-red-400/10 px-3 py-1 font-body text-xs text-red-400"
                  >
                    ✗ ვერ შეასრულა
                  </button>
                </div>
              )}
            </div>
          ))}
          {challenges.length === 0 && (
            <p className="font-body text-sm text-sky/50">
              გამოწვევები ჯერ არ არის დამატებული.
            </p>
          )}
        </div>

        {showChallengeForm && (
          <ChallengeForm
            playerId={id as string}
            onClose={() => setShowChallengeForm(false)}
            onSaved={() => {
              setShowChallengeForm(false);
              loadChallenges();
            }}
          />
        )}
      </section>

      {/* Invite code */}
      <section className="mt-10 rounded-lg border border-sky/10 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-xs text-sky">
              მოწვევის კოდი (მშობლისთვის)
            </p>
            <p className="mt-1 font-mono text-lg tracking-widest text-mist">
              {player.inviteCode}
            </p>
            <p className="mt-1 font-body text-xs text-sky/60">
              {player.inviteCodeClaimed
                ? "დაკავშირებულია მშობლის პროფილთან"
                : "ჯერ არ არის გამოყენებული"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(player.inviteCode);
                setCodeCopied(true);
                setTimeout(() => setCodeCopied(false), 1500);
              }}
              className="rounded-md border border-sky/20 px-3 py-1.5 font-body text-xs text-mist transition hover:border-ocean"
            >
              {codeCopied ? "დაკოპირდა" : "კოპირება"}
            </button>
            <button
              onClick={handleRegenerateCode}
              disabled={regenerating}
              className="rounded-md border border-sky/20 px-3 py-1.5 font-body text-xs text-mist transition hover:border-ocean disabled:opacity-50"
            >
              {regenerating ? "…" : "ახლის გენერირება"}
            </button>
          </div>
        </div>
        {player.inviteCodeClaimed && (
          <p className="mt-2 font-body text-xs text-amber-400/80">
            ახალი კოდის გენერირება გაწყვეტს კავშირს მიმდინარე მშობლის ექაუნთთან
            — ხელახლა შესასვლელად მათ ახალი კოდი დასჭირდებათ.
          </p>
        )}
      </section>

      {/* Danger zone */}
      <section className="mt-10 rounded-lg border border-red-500/20 bg-red-500/[0.03] p-4">
        <h2 className="font-display text-sm font-bold text-red-400">
          საფრთხის ზონა
        </h2>
        <p className="mt-1 font-body text-xs text-sky/60">
          მოთამაშის წაშლა სამუდამოდ წაშლის მის პროფილს და გაწყვეტს კავშირს
          მშობლის ექაუნთთან.
        </p>

        {confirmingDelete ? (
          <div className="mt-3 flex items-center gap-3">
            <span className="font-body text-sm text-mist">
              ნამდვილად გსურთ წაშალოთ {player.name} {player.surname}?
            </span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md bg-red-500 px-3 py-1.5 font-body text-xs font-medium text-white transition hover:bg-red-600 disabled:opacity-60"
            >
              {deleting ? "იშლება…" : "წაშლის დადასტურება"}
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="font-body text-xs text-sky/70 hover:text-mist"
            >
              გაუქმება
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="mt-3 rounded-md border border-red-500/30 px-3 py-1.5 font-body text-xs text-red-400 transition hover:bg-red-500/10"
          >
            მოთამაშის წაშლა
          </button>
        )}
      </section>

      <div className="mt-10 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-ocean px-6 py-2.5 font-body text-sm font-medium text-white transition hover:bg-[#0299d1] disabled:opacity-60"
        >
          {saving ? "ინახება…" : "ცვლილებების შენახვა"}
        </button>
        {saved && (
          <span className="font-body text-sm text-[#1FA97A]">შენახულია</span>
        )}
      </div>
    </div>
  );
}

function ChallengeForm({
  playerId,
  onClose,
  onSaved,
}: {
  playerId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetCount, setTargetCount] = useState(5);
  const [attemptCount, setAttemptCount] = useState(10);
  const [days, setDays] = useState(21);
  const [xpReward, setXpReward] = useState(50);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const deadline = new Date(Date.now() + days * 86400000);
    await fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId,
        title,
        description,
        targetCount,
        attemptCount,
        deadline,
        xpReward,
      }),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm rounded-xl border border-sky/10 bg-[#041B3A] p-6 space-y-4">
        <h2 className="font-display text-xl font-bold text-mist">
          ახალი გამოწვევა
        </h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="მაგ. მარცხენა ფეხით პასის სიზუსტე"
          className="w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none focus:border-ocean"
        />
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="კონკრეტული დავალების აღწერა"
          className="w-full rounded-md border border-sky/15 bg-transparent p-2 font-body text-sm text-mist outline-none focus:border-ocean"
        />
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="font-body text-xs text-sky">სამიზნე</label>
            <input
              type="number"
              value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value))}
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none"
            />
          </div>
          <div>
            <label className="font-body text-xs text-sky">მცდელობიდან</label>
            <input
              type="number"
              value={attemptCount}
              onChange={(e) => setAttemptCount(Number(e.target.value))}
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none"
            />
          </div>
          <div>
            <label className="font-body text-xs text-sky">ვადა (დღე)</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none"
            />
          </div>
        </div>
        <div>
          <label className="font-body text-xs text-sky">XP ჯილდო</label>
          <input
            type="number"
            value={xpReward}
            onChange={(e) => setXpReward(Number(e.target.value))}
            className="mt-1 w-full border-0 border-b border-sky/25 bg-transparent pb-2 font-body text-sm text-mist outline-none"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 font-body text-sm text-sky/70"
          >
            გაუქმება
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title}
            className="rounded-md bg-ocean px-4 py-2 font-body text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "იქმნება…" : "შექმნა"}
          </button>
        </div>
      </div>
    </div>
  );
}
