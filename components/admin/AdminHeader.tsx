// Path: components/admin/AdminHeader.tsx

import Link from "next/link";
import { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
}

export default function AdminHeader({
  title,
  description,
  backHref = "/admin",
  backLabel = "Dashboard",
  actions,
}: Props) {
  return (
    <header className="mb-8">
      <Link
        href={backHref}
        className="mb-4 inline-block font-body text-sm text-sky/70 hover:text-mist"
      >
        ← {backLabel}
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-extrabold text-mist">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl font-body text-sm text-sky">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}
