// Path: app/admin/layout.tsx
import { PitchMark } from "@/components/PitchMark";
import { ToastProvider } from "@/components/admin/ResultToast";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="relative min-h-screen bg-pitch-gradient">
        <PitchMark />
        <div className="relative z-10">{children}</div>
      </div>
    </ToastProvider>
  );
}
