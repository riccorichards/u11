// Path: components/admin/ModuleDialog.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import Modal from "./Modal";
import { useToast } from "./ResultToast";
import { errorMessage } from "./resultMessages";
import { button, cx, ui } from "./ui";
import { sendJson } from "./useAdminData";

export interface ModuleRecord {
  _id: string;
  slug: string;
  title: { ka: string; en: string };
  description: { ka: string; en: string };
  sequenceOrder: number;
  icon: string;
  isPublished: boolean;
}

interface Props {
  open: boolean;
  module: ModuleRecord | null; // null = create
  onClose: () => void;
  onSaved: (m: ModuleRecord) => void;
  onDeleted: (id: string) => void;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ModuleDialog({
  open,
  module,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const { show } = useToast();
  const [titleKa, setTitleKa] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [descKa, setDescKa] = useState("");
  const [descEn, setDescEn] = useState("");
  const [icon, setIcon] = useState("");
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setTitleKa(module?.title.ka ?? "");
    setTitleEn(module?.title.en ?? "");
    setSlug(module?.slug ?? "");
    setSlugTouched(Boolean(module));
    setDescKa(module?.description?.ka ?? "");
    setDescEn(module?.description?.en ?? "");
    setIcon(module?.icon ?? "");
    setPublished(module?.isPublished ?? false);
    setErrors({});
  }, [open, module]);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(titleEn));
  }, [titleEn, slugTouched]);

  async function save(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!titleKa.trim()) next.titleKa = "The Georgian title is required.";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
      next.slug =
        "Use lowercase letters, numbers and single hyphens, e.g. pitch-geography.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const body = {
        slug,
        title: { ka: titleKa.trim(), en: titleEn.trim() },
        description: { ka: descKa.trim(), en: descEn.trim() },
        icon: icon.trim(),
        isPublished: published,
      };
      const saved = module
        ? await sendJson<ModuleRecord>(
            `/api/modules/${module._id}`,
            "PATCH",
            body,
          )
        : await sendJson<ModuleRecord>("/api/modules", "POST", body);
      show({
        tone: "success",
        title: module ? "Module saved" : "Module created",
      });
      onSaved(saved);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("already exists"))
        setErrors({ slug: "Another module already uses this slug." });
      else show(errorMessage(err, "Couldn't save the module"));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!module) return;
    setSaving(true);
    try {
      await sendJson(`/api/modules/${module._id}`, "DELETE");
      show({ tone: "success", title: "Module deleted" });
      onDeleted(module._id);
    } catch (err) {
      show(errorMessage(err, "Couldn't delete the module"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={module ? "Edit module" : "New module"}
      footer={
        <>
          {module && (
            <button
              type="button"
              onClick={remove}
              disabled={saving}
              className={cx(button.danger, "mr-auto")}
            >
              Delete
            </button>
          )}
          <button type="button" onClick={onClose} className={button.secondary}>
            Cancel
          </button>
          <button
            type="submit"
            form="module-form"
            disabled={saving}
            className={button.primary}
          >
            {saving ? "Saving…" : module ? "Save module" : "Create module"}
          </button>
        </>
      }
    >
      <form id="module-form" onSubmit={save} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="m-ka" className={ui.label}>
              Title (Georgian)
            </label>
            <input
              id="m-ka"
              value={titleKa}
              onChange={(e) => setTitleKa(e.target.value)}
              className={ui.input}
            />
            {errors.titleKa && (
              <p className={cx(ui.error, "mt-1")}>{errors.titleKa}</p>
            )}
          </div>
          <div>
            <label htmlFor="m-en" className={ui.label}>
              Title (English)
            </label>
            <input
              id="m-en"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              className={ui.input}
            />
          </div>
        </div>
        <div>
          <label htmlFor="m-slug" className={ui.label}>
            Address name
          </label>
          <input
            id="m-slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase());
            }}
            placeholder="pitch-geography"
            className={ui.input}
          />
          {errors.slug ? (
            <p className={cx(ui.error, "mt-1")}>{errors.slug}</p>
          ) : (
            <p className={cx(ui.hint, "mt-1")}>
              Used in links, e.g. /brain/{slug || "pitch-geography"}.
            </p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="m-dka" className={ui.label}>
              Description (Georgian)
            </label>
            <textarea
              id="m-dka"
              rows={3}
              value={descKa}
              onChange={(e) => setDescKa(e.target.value)}
              className={ui.input}
            />
          </div>
          <div>
            <label htmlFor="m-den" className={ui.label}>
              Description (English)
            </label>
            <textarea
              id="m-den"
              rows={3}
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              className={ui.input}
            />
          </div>
        </div>
        <div>
          <label htmlFor="m-icon" className={ui.label}>
            Icon (optional)
          </label>
          <input
            id="m-icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="map"
            className={ui.input}
          />
        </div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#018ABE]"
          />
          <span>
            <span className="block font-body text-sm text-mist">Published</span>
            <span className={ui.hint}>
              Players only see published modules. Keep it off while you build.
            </span>
          </span>
        </label>
      </form>
    </Modal>
  );
}
