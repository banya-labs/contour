export type OperationAction =
  | "PROPERTY_PUBLISH"
  | "PROPERTY_SAVE"
  | "DEAL_CREATE"
  | "DEAL_SAVE"
  | "DEAL_MOVE"
  | "DEAL_CLOSE"
  | "CLIENT_SAVE"
  | "CLIENT_DELETE"
  | "SALE_RECORD"
  | "LEASE_CREATE"
  | "STATEMENT_CREATE"
  | "STATEMENT_AUTHORIZE";

const LABELS: Record<OperationAction, string> = {
  PROPERTY_PUBLISH: "Publishing property…",
  PROPERTY_SAVE: "Saving property…",
  DEAL_CREATE: "Creating deal…",
  DEAL_SAVE: "Saving deal…",
  DEAL_MOVE: "Moving deal…",
  DEAL_CLOSE: "Closing deal…",
  CLIENT_SAVE: "Saving client changes…",
  CLIENT_DELETE: "Deleting client…",
  SALE_RECORD: "Recording conveyance…",
  LEASE_CREATE: "Creating lease…",
  STATEMENT_CREATE: "Generating statement…",
  STATEMENT_AUTHORIZE: "Authorising statement…",
};

export const operationPendingLabel = (action: OperationAction) =>
  LABELS[action];

export const operationActionKey = (
  recordId: string,
  action: OperationAction,
) => `${recordId}:${action.toLowerCase().replaceAll("_", "-")}`;
