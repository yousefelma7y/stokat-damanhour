import { Loader } from "lucide-react";

/** Grey pulsing placeholder block. Size it with className (e.g. "h-6 w-32"). */
export function Skeleton({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`block rounded-md bg-slate-200 animate-pulse ${className}`}
    />
  );
}

/** Small inline spinner for buttons and "refreshing" hints. */
export function Spinner({ className = "w-4 h-4" }) {
  return <Loader aria-hidden="true" className={`animate-spin ${className}`} />;
}

/** Translucent layer with a spinner, for refreshing content that is already on screen. */
export function LoadingOverlay({ label = "جاري التحميل..." }) {
  return (
    <div
      role="status"
      className="z-10 absolute inset-0 flex justify-center items-center bg-white/60 backdrop-blur-[1px] rounded-[inherit]"
    >
      <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow">
        <Spinner className="w-4 h-4 text-blue-600" />
        {label}
      </span>
    </div>
  );
}

/** A row of stat-card placeholders. */
export function StatCardsSkeleton({ count = 4, className = "grid grid-cols-2 xl:grid-cols-4 gap-3" }) {
  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-28" />
        </div>
      ))}
    </div>
  );
}

/** List-row placeholders (icon + two text lines + trailing value). */
export function RowsSkeleton({ count = 5 }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 last:border-b-0">
          <Skeleton className="size-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48 max-w-full" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}
