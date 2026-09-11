import crypto from "node:crypto";

export const CORRELATION_HEADER = "x-correlation-id";

export function getOrCreateCorrelationId(request: Request): string {
  const supplied = request.headers.get(CORRELATION_HEADER)?.trim();
  return supplied && supplied.length <= 128 ? supplied : crypto.randomUUID();
}

export function setCorrelationHeader(response: Response, correlationId: string): Response {
  response.headers.set(CORRELATION_HEADER, correlationId);
  return response;
}
