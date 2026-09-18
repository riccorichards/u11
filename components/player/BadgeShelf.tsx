export function BadgeShelf({ badges }: { badges: any[] }) {
  return (
    <div className="rounded-2xl border border-sky/10 bg-white/[0.03] p-5">
      <p className="font-body text-xs uppercase tracking-wide text-sky">
        🏅 My Badges ({badges.length})
      </p>
      {badges.length === 0 ? (
        <p className="mt-2 font-body text-sm text-sky/50">
          No badges yet — go earn one!
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {badges.map((b: any) => (
            <div key={b._id} className="flex flex-col items-center gap-1">
              {b.iconUrl ? (
                <img
                  src={b.iconUrl}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-ocean/20" />
              )}
              <span className="text-center font-body text-[10px] leading-tight text-sky/70">
                {b.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
