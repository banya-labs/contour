import { describe, expect, it } from "vitest";
import {
  authTransitionCopy,
  shouldBlockAuthSurface,
} from "./auth-transition";

describe("auth transition feedback", () => {
  it("keeps the surface blocked from successful credentials through navigation", () => {
    expect(shouldBlockAuthSurface("AUTHENTICATING")).toBe(true);
    expect(shouldBlockAuthSurface("CLAIMING_INVITATION")).toBe(true);
    expect(shouldBlockAuthSurface("ACTIVATING_ORGANIZATION")).toBe(true);
    expect(shouldBlockAuthSurface("NAVIGATING")).toBe(true);
    expect(shouldBlockAuthSurface("IDLE")).toBe(false);
    expect(shouldBlockAuthSurface("ERROR")).toBe(false);
  });

  it("never claims completion before navigation", () => {
    expect(authTransitionCopy("AUTHENTICATING").label).toBe("Signing you in…");
    expect(authTransitionCopy("CLAIMING_INVITATION").label).toBe(
      "Checking your agency access…",
    );
    expect(authTransitionCopy("ACTIVATING_ORGANIZATION").label).toBe(
      "Securing your workspace…",
    );
    expect(authTransitionCopy("NAVIGATING").label).toBe(
      "Opening your workspace…",
    );
  });

  it("uses account-creation copy for sign-up", () => {
    expect(authTransitionCopy("CREATING_ACCOUNT").label).toBe(
      "Creating your account…",
    );
  });
});
