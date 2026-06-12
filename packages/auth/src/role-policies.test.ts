import { describe, expect, it } from "vitest";
import {
  canManageUsers,
  canViewKycFields,
  canWriteFinancialRecords,
  canWriteKycFields,
  isContourRole,
} from "./role-policies";

describe("role policies", () => {
  it("recognizes valid contour roles", () => {
    expect(isContourRole("admin")).toBe(true);
    expect(isContourRole("agent")).toBe(true);
    expect(isContourRole("finance")).toBe(true);
    expect(isContourRole("legal")).toBe(true);
    expect(isContourRole("auditor")).toBe(true);
    expect(isContourRole("guest")).toBe(false);
  });

  it("restricts KYC writes to privileged roles", () => {
    expect(canWriteKycFields("admin")).toBe(true);
    expect(canWriteKycFields("legal")).toBe(true);
    expect(canWriteKycFields("finance")).toBe(false);
    expect(canWriteKycFields("agent")).toBe(false);
    expect(canWriteKycFields("auditor")).toBe(false);
  });

  it("allows finance access to money records but not user administration", () => {
    expect(canWriteFinancialRecords("finance")).toBe(true);
    expect(canWriteFinancialRecords("admin")).toBe(true);
    expect(canManageUsers("admin")).toBe(true);
    expect(canManageUsers("finance")).toBe(false);
  });

  it("allows read-only KYC access to oversight roles", () => {
    expect(canViewKycFields("admin")).toBe(true);
    expect(canViewKycFields("legal")).toBe(true);
    expect(canViewKycFields("finance")).toBe(true);
    expect(canViewKycFields("auditor")).toBe(true);
    expect(canViewKycFields("agent")).toBe(false);
  });
});
