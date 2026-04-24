export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* Hero grid skeleton */}
      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="h-36 rounded-xl bg-gradient-to-br from-primary/30 to-primary-container/30 md:col-span-2" />
        <div className="h-36 rounded-xl bg-surface-container-lowest shadow-sm" />
        <div className="h-36 rounded-xl bg-surface-container-lowest shadow-sm" />
      </section>

      {/* Header row skeleton */}
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded bg-surface-container" />
          <div className="h-4 w-64 rounded bg-surface-container" />
          <div className="h-3 w-40 rounded bg-surface-container" />
        </div>
        <div className="flex w-full items-center gap-2 md:max-w-xl">
          <div className="h-10 flex-1 rounded-full bg-surface-container" />
          <div className="h-10 w-20 rounded-full bg-surface-container" />
        </div>
      </div>

      {/* Category chips skeleton */}
      <div className="mb-6 flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-7 w-20 rounded-full bg-surface-container"
            style={{ width: `${60 + ((i * 17) % 50)}px` }}
          />
        ))}
      </div>

      {/* Offer grid skeleton */}
      <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm"
          >
            <div className="h-40 bg-gradient-to-br from-surface-container-high to-surface-container" />
            <div className="space-y-3 p-5">
              <div className="h-5 w-3/4 rounded bg-surface-container" />
              <div className="h-3 w-1/2 rounded bg-surface-container" />
              <div className="h-3 w-2/3 rounded bg-surface-container" />
              <div className="h-10 w-full rounded-lg bg-surface-container" />
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        Loading dashboard…
      </span>
    </div>
  );
}
