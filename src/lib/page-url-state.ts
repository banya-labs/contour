/** Update only the requested fields, preserving tabs, other filters, and hashes. */
export function updatePageUrl(href: string, updates: Record<string, string | null>): string {
  const url = new URL(href);
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === "") url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

/** A creation link is a one-time command, not a persistent page view. */
export function consumeCreationLink(): URLSearchParams | null {
  const url = new URL(window.location.href);
  if (!["1", "true"].includes(url.searchParams.get("new") || "")) return null;
  const action = new URLSearchParams(url.searchParams);
  // Next copies its router metadata itself; passing it back would skip URL synchronization.
  window.history.replaceState(null, "", updatePageUrl(url.href, { new: null, prefill: null }));
  return action;
}
