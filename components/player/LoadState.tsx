// Path: components/player/LoadState.tsx

import { copy } from "./copy";
import { bigButton, playerCard } from "./theme";

/** Shared loading and error blocks so every screen behaves the same. */
export function Loading() {
  return (
    <p className="py-16 text-center font-body text-sm text-sky/70">
      {copy.loading}
    </p>
  );
}

export function LoadError({
  what,
  onRetry,
}: {
  what: string;
  onRetry: () => void;
}) {
  return (
    <div className={`${playerCard} px-5 py-10 text-center`}>
      <p className="font-body text-sm text-sky">{copy.loadError(what)}</p>
      <button
        type="button"
        onClick={onRetry}
        className={`${bigButton} mt-4 border border-white/15 text-mist`}
      >
        {copy.retry}
      </button>
    </div>
  );
}
