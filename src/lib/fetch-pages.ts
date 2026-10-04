export async function fetchAllPages<T>(url: string, field: string, pageSize = 100): Promise<T[]> {
  const items: T[] = [];
  let page = 1, more = true;
  while (more) {
    const separator = url.includes("?") ? "&" : "?";
    const response = await fetch(`${url}${separator}page=${page}&pageSize=${pageSize}&limit=${pageSize}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to load records");
    items.push(...(payload[field] || []));
    more = Boolean(payload.hasMore ?? (payload.pagination?.page < payload.pagination?.totalPages));
    page++;
  }
  return items;
}
