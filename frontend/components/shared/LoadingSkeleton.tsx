// components/shared/LoadingSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export function TableSkeleton({ rows = 8, className }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex gap-4 px-4 py-3">
        {[40, 120, 80, 60, 60, 60].map((w, i) => (
          <Skeleton key={i} className="h-4 rounded" style={{ width: `${w}px` }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-t border-border">
          {[40, 120, 80, 60, 60, 60].map((w, j) => (
            <Skeleton key={j} className="h-4 rounded" style={{ width: `${w}px` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-6 space-y-3", className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-48" />
    </div>
  );
}
