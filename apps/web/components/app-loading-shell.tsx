export function AppLoadingShell() {
  return (
    <div className="min-h-screen px-4 py-4 text-[color:var(--foreground)] lg:px-6 lg:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1800px] gap-4 lg:gap-5">
        <aside className="hidden w-[290px] shrink-0 flex-col self-start rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-[0_18px_50px_rgba(39,26,0,0.07)] lg:flex lg:sticky lg:top-6">
          <div className="h-16 rounded-[20px] bg-[color:var(--surface-muted)] animate-pulse" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-28 rounded-[22px] bg-[color:var(--surface-muted)] animate-pulse" />
            ))}
          </div>
          <div className="mt-auto h-24 rounded-[22px] bg-[color:var(--surface-muted)] animate-pulse" />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
            <div className="h-6 w-28 rounded-full bg-[color:var(--surface-muted)] animate-pulse" />
            <div className="mt-4 h-10 w-80 rounded-[20px] bg-[color:var(--surface-muted)] animate-pulse" />
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-24 rounded-[18px] bg-[color:var(--surface-muted)] animate-pulse" />
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
            <div className="h-5 w-48 rounded-full bg-[color:var(--surface-muted)] animate-pulse" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-14 rounded-[18px] bg-[color:var(--surface-muted)] animate-pulse" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
