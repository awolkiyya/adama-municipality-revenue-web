import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type PaymentDetailSkeletonProps = {
  className?: string;
};

export function PaymentDetailSkeleton({
  className,
}: PaymentDetailSkeletonProps) {
  return (
    <div
      className={cn("space-y-6", className)}
      aria-busy="true"
      aria-label="Loading payment details"
    >
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 max-w-full" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Payment overview */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-9 rounded-lg" />
            </div>

            <Skeleton className="mt-4 h-7 w-36 max-w-full" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Main details */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* Status */}
          <section className="rounded-xl border p-5">
            <div className="flex items-start gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />

              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40 max-w-full" />
                <Skeleton className="h-4 w-64 max-w-full" />
              </div>

              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </section>

          {/* Payment information */}
          <section className="rounded-xl border p-5">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="mt-2 h-4 w-64 max-w-full" />

            <div className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-5 w-40 max-w-full" />
                </div>
              ))}
            </div>
          </section>

          {/* Payment method */}
          <section className="rounded-xl border p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-4 w-56 max-w-full" />

            <div className="mt-5 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3"
                >
                  <Skeleton className="size-9 shrink-0 rounded-lg" />

                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-4 w-48 max-w-full" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Amount summary */}
          <section className="rounded-xl border p-5">
            <Skeleton className="h-5 w-36" />

            <div className="mt-5 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-4"
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}

              <div className="border-t pt-4">
                <div className="flex items-center justify-between gap-4">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-7 w-32" />
                </div>
              </div>
            </div>
          </section>

          {/* Receipt actions */}
          <section className="rounded-xl border p-5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-1 h-4 w-3/4" />

            <div className="mt-5 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </section>

          {/* Timeline */}
          <section className="rounded-xl border p-5">
            <Skeleton className="h-5 w-32" />

            <div className="mt-5 space-y-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex gap-3">
                  <Skeleton className="size-8 shrink-0 rounded-full" />

                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32 max-w-full" />
                    <Skeleton className="h-3 w-44 max-w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PaymentDetailSkeleton;
