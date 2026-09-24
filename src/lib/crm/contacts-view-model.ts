export type ContactRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  lookingFor: string;
  preferredSuburbs: string[];
  budgetMax: string;
  rawBudgetMax: number | null;
  currency: string;
  purpose: "BUY" | "RENT";
  leadSource: string;
  assignedAgentId: string;
  assignedAgent: string;
  lockExpiresInDays: number;
  status: string;
  notes: string;
  inquiry: Record<string, unknown>;
};

type InquiryLike = {
  id: string;
  clientName?: string | null;
  clientPhone?: string | null;
  clientEmail?: string | null;
  email?: string | null;
  notes?: string | null;
  preferredSuburbs?: string[] | null;
  budgetMax?: number | string | null;
  currency?: string | null;
  lookingFor?: string | null;
  leadSource?: string | null;
  assignedAgentId?: string | null;
  assignedAgent?: { name?: string | null } | null;
  exclusiveLockExpiresAt?: string | Date | null;
  status?: string | null;
  [key: string]: unknown;
};

const cleanSourceAndNotes = (notes: string) => {
  const sourceMatch = notes.match(/^\[Source:\s*([^\]]+)\]\s*/);
  return {
    leadSource: sourceMatch?.[1] || "Portal / Inbound",
    notes: notes.replace(/^\[Source:\s*[^\]]+\]\s*/, "").trim(),
  };
};

const lockDaysRemaining = (value: InquiryLike["exclusiveLockExpiresAt"]) => {
  if (!value) return 0;
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000));
};

export function normalizeInquiryContact(inquiry: InquiryLike): ContactRow {
  const name = inquiry.clientName?.trim() || "Unnamed contact";
  const notes = inquiry.notes?.trim() || "Searching for property";
  const parsedNotes = cleanSourceAndNotes(notes);
  const rawBudgetMax = inquiry.budgetMax == null ? null : Number(inquiry.budgetMax);
  const currency = inquiry.currency || "ZMW";

  return {
    id: inquiry.id,
    name,
    phone: inquiry.clientPhone?.trim() || "No phone",
    email: inquiry.email || inquiry.clientEmail || "",
    lookingFor: parsedNotes.notes || "Searching for property",
    preferredSuburbs: inquiry.preferredSuburbs || [],
    budgetMax: rawBudgetMax == null || Number.isNaN(rawBudgetMax)
      ? "No budget limit"
      : `${currency === "USD" ? "$" : "K"} ${rawBudgetMax.toLocaleString()}`,
    rawBudgetMax: rawBudgetMax == null || Number.isNaN(rawBudgetMax) ? null : rawBudgetMax,
    currency,
    purpose: inquiry.lookingFor === "FOR_RENT" ? "RENT" : "BUY",
    leadSource: inquiry.leadSource || parsedNotes.leadSource,
    assignedAgentId: inquiry.assignedAgentId || inquiry.assignedAgent?.name || "",
    assignedAgent: inquiry.assignedAgent?.name || "Unassigned",
    lockExpiresInDays: lockDaysRemaining(inquiry.exclusiveLockExpiresAt),
    status: inquiry.status || "NEW_INQUIRY",
    notes: inquiry.notes || "",
    inquiry: inquiry as Record<string, unknown>,
  };
}

export function sortContactsAlphabetically(rows: ContactRow[]) {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

export function filterContacts(
  rows: ContactRow[],
  filters: { search: string; status: string; assignment: "ALL" | "ASSIGNED" },
) {
  const search = filters.search.trim().toLocaleLowerCase();
  return sortContactsAlphabetically(rows).filter((row) => {
    const searchable = [row.name, row.phone, row.email].join(" ").toLocaleLowerCase();
    const matchesSearch = !search || searchable.includes(search);
    const matchesStatus = filters.status === "ALL" || row.status === filters.status;
    const matchesAssignment = filters.assignment === "ALL" || Boolean(row.assignedAgentId);
    return matchesSearch && matchesStatus && matchesAssignment;
  });
}
