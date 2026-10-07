// Path: app/admin/tasks/new/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import TaskForm from "@/components/admin/TaskForm";
import { card, cx } from "@/components/admin/ui";

function NewTask() {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <AdminHeader title="New task" backHref="/admin/tasks" backLabel="Tasks" />
      <div className={cx(card, "p-6")}>
        <TaskForm
          defaultTopicId={params.get("topic")}
          onSaved={(task) => router.push(`/admin/tasks/${task._id}`)}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}

export default function NewTaskPage() {
  return (
    <Suspense>
      <NewTask />
    </Suspense>
  );
}
