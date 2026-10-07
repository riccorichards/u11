// Path: components/admin/TopicPicker.tsx
"use client";

import {
  KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { ModuleTreeDTO, TreeDatumDTO, useModuleTrees } from "./useAdminData";
import { cx, plural, ui } from "./ui";

export interface TopicOption {
  id: string;
  title: string;
  titleEn: string;
  moduleId: string | null;
  moduleTitle: string;
  depth: number;
  /** Ancestor titles, outermost first. */
  path: string[];
  /** Number of topics below this one (useful for branch badges). */
  descendantCount: number;
}

function countDescendants(node: TreeDatumDTO): number {
  return node.children.reduce((sum, c) => sum + 1 + countDescendants(c), 0);
}

/** Flattens the module trees into one ordered list with depth and path. */
export function flattenTopics(trees: ModuleTreeDTO[]): TopicOption[] {
  const out: TopicOption[] = [];
  for (const t of trees) {
    const walk = (node: TreeDatumDTO, depth: number, path: string[]) => {
      out.push({
        id: String(node.attributes.id),
        title: node.name,
        titleEn: String(node.attributes.titleEn ?? ""),
        moduleId: t.moduleId,
        moduleTitle: t.title.ka,
        depth,
        path,
        descendantCount: countDescendants(node),
      });
      node.children.forEach((c) => walk(c, depth + 1, [...path, node.name]));
    };
    t.tree.children.forEach((c) => walk(c, 0, []));
  }
  return out;
}

interface Props {
  value: string | null;
  onChange: (topicId: string | null, topic: TopicOption | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string | null;
  disabled?: boolean;
  hint?: string;
}

export default function TopicPicker({
  value,
  onChange,
  label = "Topic",
  placeholder = "Choose a topic",
  required = false,
  error,
  disabled = false,
  hint,
}: Props) {
  const { data, loading, error: loadError } = useModuleTrees();
  const topics = useMemo(() => flattenTopics(data?.trees ?? []), [data]);
  const selected = topics.find((t) => t.id === value) ?? null;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const labelId = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter((t) =>
      [t.title, t.titleEn, t.moduleTitle, ...t.path].some((s) =>
        s.toLowerCase().includes(q),
      ),
    );
  }, [topics, query]);

  useEffect(() => {
    if (!open) return;
    setActive(
      Math.max(
        0,
        filtered.findIndex((t) => t.id === value),
      ),
    );
    searchRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    if (!open) return;
    document
      .getElementById(`${listId}-${active}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open, listId]);

  function choose(t: TopicOption | null) {
    onChange(t?.id ?? null, t);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) choose(filtered[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  let lastModule: string | null | undefined;

  return (
    <div ref={rootRef} className="relative min-w-0">
      <span id={labelId} className={ui.label}>
        {label}
        {required && <span className="text-[#E8735C]"> *</span>}
      </span>

      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        className={cx(
          ui.input,
          "flex items-center justify-between gap-2 text-left",
          error && "border-[#E8735C]",
        )}
      >
        {loading ? (
          <span className="text-sky/40">Loading topics…</span>
        ) : selected ? (
          <span className="min-w-0 truncate">
            {selected.title}
            <span className="text-sky/50">
              {"  "}
              {[selected.moduleTitle, ...selected.path].join(" › ")}
            </span>
          </span>
        ) : (
          <span className="text-sky/40">{placeholder}</span>
        )}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          aria-hidden
          className="shrink-0 text-sky/60"
        >
          <path
            d="M2 4l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </button>

      {hint && !error && <p className={cx(ui.hint, "mt-1")}>{hint}</p>}
      {error && <p className={cx(ui.error, "mt-1")}>{error}</p>}
      {loadError && (
        <p className={cx(ui.error, "mt-1")}>
          Couldn&apos;t load topics: {loadError}
        </p>
      )}

      {open && (
        <div
          className={cx(
            ui.panel,
            "absolute z-30 mt-1 w-full min-w-[18rem] p-2",
          )}
        >
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search topics in Georgian or English"
            aria-controls={listId}
            aria-activedescendant={
              filtered[active] ? `${listId}-${active}` : undefined
            }
            className={ui.input}
          />
          <ul
            id={listId}
            role="listbox"
            aria-labelledby={labelId}
            className="mt-2 max-h-80 overflow-y-auto"
          >
            {filtered.length === 0 && (
              <li className={cx(ui.hint, "px-3 py-4")}>
                {topics.length === 0
                  ? "No topics yet. Build them in the Skill Tree Builder."
                  : "No topics match."}
              </li>
            )}
            {filtered.map((t, i) => {
              const showHeader = t.moduleId !== lastModule;
              lastModule = t.moduleId;
              return (
                <li key={t.id} role="presentation">
                  {showHeader && (
                    <div className="px-3 pb-1 pt-3 font-display text-xs font-bold text-sky/70">
                      {t.moduleTitle}
                    </div>
                  )}
                  <div
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={t.id === value}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(t)}
                    className={cx(
                      "flex cursor-pointer items-baseline gap-2 rounded-md py-1.5 pr-3 font-body text-sm",
                      i === active ? "bg-ocean/20 text-mist" : "text-sky/90",
                      t.id === value && "font-semibold text-mist",
                    )}
                    style={{
                      paddingLeft: `${0.75 + (query ? 0 : t.depth) * 1}rem`,
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {t.title}
                      {t.titleEn && (
                        <span className="text-sky/50"> ({t.titleEn})</span>
                      )}
                      {query && t.path.length > 0 && (
                        <span className="block truncate text-xs text-sky/50">
                          {t.path.join(" › ")}
                        </span>
                      )}
                    </span>
                    {t.descendantCount > 0 && (
                      <span className="shrink-0 text-xs text-sky/50">
                        {plural(t.descendantCount, "topic")} below
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {!required && value && (
            <button
              type="button"
              onClick={() => choose(null)}
              className={cx(ui.textButton, ui.focus, "mt-2 px-3")}
            >
              Remove topic
            </button>
          )}
        </div>
      )}
    </div>
  );
}
