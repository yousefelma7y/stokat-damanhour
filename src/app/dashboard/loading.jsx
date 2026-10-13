import { RowsSkeleton, Skeleton, StatCardsSkeleton } from "@/components/Skeleton";

// Shown instantly while a dashboard page is being loaded, so navigation never looks frozen.
export default function DashboardLoading() {
  return (
    <div dir="rtl" role="status" aria-label="جاري التحميل" className="p-4 sm:p-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <StatCardsSkeleton className="grid grid-cols-2 lg:grid-cols-4 gap-4" />
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <RowsSkeleton count={6} />
      </div>
    </div>
  );
}
