import { describe, expect, it, vi } from "vitest";
import {
  createDelayedPending,
  isKeyPending,
  setKeyPending,
} from "./loading-feedback";

describe("loading feedback state", () => {
  it("does not flash delayed feedback after a fast action finishes", () => {
    vi.useFakeTimers();
    const visibility: boolean[] = [];
    const pending = createDelayedPending(150, (visible) =>
      visibility.push(visible),
    );

    pending.start();
    pending.stop();
    vi.advanceTimersByTime(200);

    expect(visibility).toEqual([false]);
    vi.useRealTimers();
  });

  it("shows delayed feedback for a slower action and clears it", () => {
    vi.useFakeTimers();
    const visibility: boolean[] = [];
    const pending = createDelayedPending(150, (visible) =>
      visibility.push(visible),
    );

    pending.start();
    vi.advanceTimersByTime(150);
    pending.stop();

    expect(visibility).toEqual([true, false]);
    vi.useRealTimers();
  });

  it("tracks row actions independently", () => {
    let state: ReadonlySet<string> = new Set();
    state = setKeyPending(state, "member-a", true);
    state = setKeyPending(state, "member-b", true);
    state = setKeyPending(state, "member-a", false);

    expect(isKeyPending(state, "member-a")).toBe(false);
    expect(isKeyPending(state, "member-b")).toBe(true);
  });
});
