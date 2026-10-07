// Path: components/admin/useAdminData.ts

import { useCallback, useEffect, useState } from "react";
import type { Position } from "./ui";

/** Requests are shared between components on the same page, so the roster loads once. */
const cache = new Map<string, Promise<unknown>>();

/** Forget cached data, e.g. after creating a group. No argument clears everything. */
export function invalidateAdminData(url?: string) {
  if (url) cache.delete(url);
  else cache.clear();
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (data as { error?: string } | null)?.error ??
      `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export function useCached<T>(url: string | null) {
  const [state, setState] = useState<{
    data: T | null;
    error: string | null;
    loading: boolean;
  }>({
    data: null,
    error: null,
    loading: Boolean(url),
  });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    if (!cache.has(url)) cache.set(url, fetchJson<T>(url));
    (cache.get(url) as Promise<T>)
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((err: Error) => {
        cache.delete(url);
        if (alive) setState({ data: null, error: err.message, loading: false });
      });
    return () => {
      alive = false;
    };
  }, [url, version]);

  const reload = useCallback(() => {
    if (url) cache.delete(url);
    setVersion((v) => v + 1);
  }, [url]);

  return { ...state, reload };
}

export interface PlayerOption {
  _id: string;
  name: string;
  surname: string;
  number: number;
  position: Position;
}

export interface GroupOption {
  _id: string;
  name: string;
  description: string;
  color: string;
  playerIds: PlayerOption[]; // populated by GET /api/groups
  isArchived: boolean;
}

export interface TreeDatumDTO {
  name: string;
  attributes: Record<string, string | number | boolean>;
  children: TreeDatumDTO[];
}

export interface ModuleTreeDTO {
  moduleId: string | null;
  slug: string;
  title: { ka: string; en: string };
  isPublished: boolean;
  topicCount: number;
  tree: TreeDatumDTO;
}

export const usePlayers = () => useCached<PlayerOption[]>("/api/players");
export const useGroups = () => useCached<GroupOption[]>("/api/groups");
export const useModuleTrees = () =>
  useCached<{ trees: ModuleTreeDTO[] }>(
    "/api/skill-tree/modules?includeUnpublished=true&includeUnassigned=true",
  );

/** POST/PATCH/DELETE with a JSON body. Throws with the API's error message. */
export function sendJson<T>(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  return fetchJson<T>(url, {
    method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
