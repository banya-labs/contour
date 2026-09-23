import { describe, expect, it } from "vitest";
import {
  operationActionKey,
  operationPendingLabel,
} from "./operation-feedback";

describe("operation feedback contract", () => {
  it("provides truthful labels for core mutations", () => {
    expect(operationPendingLabel("PROPERTY_PUBLISH")).toBe(
      "Publishing property…",
    );
    expect(operationPendingLabel("DEAL_MOVE")).toBe("Moving deal…");
    expect(operationPendingLabel("SALE_RECORD")).toBe(
      "Recording conveyance…",
    );
    expect(operationPendingLabel("STATEMENT_AUTHORIZE")).toBe(
      "Authorising statement…",
    );
  });

  it("separates actions on the same record", () => {
    expect(operationActionKey("client-1", "CLIENT_SAVE")).toBe(
      "client-1:client-save",
    );
    expect(operationActionKey("client-1", "CLIENT_DELETE")).toBe(
      "client-1:client-delete",
    );
  });
});
