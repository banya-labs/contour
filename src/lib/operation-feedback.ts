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
  | "STATEMENT_AUTHORIZE"
  | "DOCUMENT_UPLOAD"
  | "DOCUMENT_DOWNLOAD"
  | "DOCUMENT_VERIFY"
  | "DOCUMENT_DELETE"
  | "DOCUMENT_REQUEST"
  | "COLLABORATOR_ADD"
  | "COLLABORATOR_REMOVE"
  | "VAULT_ACCESS_UPDATE"
  | "LOGO_UPLOAD"
  | "ACCESS_LINK_CREATE"
  | "ACCESS_REQUEST_APPROVE"
  | "ACCESS_REQUEST_DECLINE"
  | "MEMBER_ROLE_CHANGE"
  | "MEMBER_SUSPEND"
  | "MEMBER_DELETE"
  | "INVITATION_CREATE"
  | "INVITATION_REVOKE"
  | "MFA_ENABLE"
  | "MFA_VERIFY"
  | "MFA_DISABLE"
  | "CHECKOUT_CREATE"
  | "ANALYTICS_REFRESH"
  | "REPORT_GENERATE";

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
  DOCUMENT_UPLOAD: "Uploading document…",
  DOCUMENT_DOWNLOAD: "Preparing download…",
  DOCUMENT_VERIFY: "Verifying document…",
  DOCUMENT_DELETE: "Deleting document…",
  DOCUMENT_REQUEST: "Creating secure request…",
  COLLABORATOR_ADD: "Adding collaborator…",
  COLLABORATOR_REMOVE: "Removing collaborator…",
  VAULT_ACCESS_UPDATE: "Updating vault access…",
  LOGO_UPLOAD: "Uploading agency logo…",
  ACCESS_LINK_CREATE: "Creating access link…",
  ACCESS_REQUEST_APPROVE: "Approving access request…",
  ACCESS_REQUEST_DECLINE: "Declining access request…",
  MEMBER_ROLE_CHANGE: "Updating member role…",
  MEMBER_SUSPEND: "Updating member access…",
  MEMBER_DELETE: "Removing member…",
  INVITATION_CREATE: "Creating invitation…",
  INVITATION_REVOKE: "Revoking invitation…",
  MFA_ENABLE: "Enabling MFA…",
  MFA_VERIFY: "Verifying code…",
  MFA_DISABLE: "Disabling MFA…",
  CHECKOUT_CREATE: "Preparing secure checkout…",
  ANALYTICS_REFRESH: "Refreshing analytics…",
  REPORT_GENERATE: "Generating report…",
};

export const operationPendingLabel = (action: OperationAction) =>
  LABELS[action];

export const operationActionKey = (
  recordId: string,
  action: OperationAction,
) => `${recordId}:${action.toLowerCase().replaceAll("_", "-")}`;
