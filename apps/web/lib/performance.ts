import { performance } from "node:perf_hooks";

type RouteTimerMeasureOptions = {
  note?: string;
};

type RouteTimerFinishOptions = {
  count?: number;
  note?: string;
};

type RouteTimer = {
  measure<T>(label: string, fn: () => Promise<T> | T, options?: RouteTimerMeasureOptions): Promise<T>;
  finish(options?: RouteTimerFinishOptions): void;
};

function formatNote(note?: string) {
  return note ? ` note=${note}` : "";
}

function logRouteTimer(message: string) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info(`[route-timer] ${message}`);
}

export function createRouteTimer(routeName: string): RouteTimer {
  const startedAt = performance.now();

  return {
    async measure<T>(label: string, fn: () => Promise<T> | T, options?: RouteTimerMeasureOptions) {
      const stepStartedAt = performance.now();

      try {
        const result = await fn();
        const elapsedMs = Math.round(performance.now() - stepStartedAt);
        logRouteTimer(`${routeName}:${label} ${elapsedMs}ms${formatNote(options?.note)}`);
        return result;
      } catch (error) {
        const elapsedMs = Math.round(performance.now() - stepStartedAt);
        const reason = error instanceof Error ? error.message : String(error);
        logRouteTimer(`${routeName}:${label} failed after ${elapsedMs}ms${formatNote(options?.note)} reason=${reason}`);
        throw error;
      }
    },
    finish(options?: RouteTimerFinishOptions) {
      const elapsedMs = Math.round(performance.now() - startedAt);
      const countPart = typeof options?.count === "number" ? ` count=${options.count}` : "";
      logRouteTimer(`${routeName} finished in ${elapsedMs}ms${countPart}${formatNote(options?.note)}`);
    },
  };
}