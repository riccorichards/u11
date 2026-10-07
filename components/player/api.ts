// Path: components/player/api.ts

/** The player screens share the admin data helpers (one cache, one error format). */
export {
  useCached,
  sendJson,
  fetchJson,
  invalidateAdminData as invalidateCache,
} from "@/components/admin/useAdminData";
export type {
  ModuleTreeDTO,
  TreeDatumDTO,
} from "@/components/admin/useAdminData";
