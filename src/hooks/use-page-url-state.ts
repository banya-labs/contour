"use client";

import { useSearchParams } from "next/navigation";
import { updatePageUrl } from "@/lib/page-url-state";

/** Keep navigation state in the URL so reload and browser history restore it. */
export function usePageUrlState<T extends string>(key: string, fallback: T, allowed?: readonly T[]) {
  const params = useSearchParams();
  const raw = params?.get(key);
  const value = raw !== null && raw !== undefined && (!allowed || allowed.includes(raw as T)) ? raw as T : fallback;
  const setValue = (next: T) => {
    window.history.replaceState(null, "", updatePageUrl(window.location.href, { [key]: next === fallback ? null : next }));
  };
  return [value, setValue] as const;
}
