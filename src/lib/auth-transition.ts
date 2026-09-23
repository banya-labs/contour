export type AuthTransitionStage =
  | "IDLE"
  | "AUTHENTICATING"
  | "CREATING_ACCOUNT"
  | "CLAIMING_INVITATION"
  | "ACTIVATING_ORGANIZATION"
  | "CREATING_WORKSPACE"
  | "NAVIGATING"
  | "ERROR";

const COPY: Record<
  AuthTransitionStage,
  { label: string; description?: string }
> = {
  IDLE: { label: "Ready" },
  AUTHENTICATING: {
    label: "Signing you in…",
    description: "Verifying your secure credentials.",
  },
  CREATING_ACCOUNT: {
    label: "Creating your account…",
    description: "Setting up your secure Contour identity.",
  },
  CLAIMING_INVITATION: {
    label: "Checking your agency access…",
    description: "Resolving invitations and membership.",
  },
  ACTIVATING_ORGANIZATION: {
    label: "Securing your workspace…",
    description: "Activating the correct agency context.",
  },
  CREATING_WORKSPACE: {
    label: "Creating your workspace…",
    description: "Preparing your agency operations environment.",
  },
  NAVIGATING: {
    label: "Opening your workspace…",
    description: "Taking you to the correct Contour surface.",
  },
  ERROR: { label: "Action could not be completed" },
};

export const authTransitionCopy = (stage: AuthTransitionStage) => COPY[stage];

export const shouldBlockAuthSurface = (stage: AuthTransitionStage) =>
  stage !== "IDLE" && stage !== "ERROR";
