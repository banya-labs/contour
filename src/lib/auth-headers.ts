/** Normalize framework header wrappers before passing them to Better Auth. */
export function toAuthHeaders(headers: HeadersInit): Headers {
  return new Headers(headers);
}
