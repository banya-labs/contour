type InquiryStatusRecord = { status?: string | null };

const CLOSED_INQUIRY_STATUSES = new Set(["CLOSED", "CLOSED_WON", "CLOSED_LOST"]);

export function filterActivePwaInquiries<T extends InquiryStatusRecord>(inquiries: T[]): T[] {
  return inquiries.filter((inquiry) => !CLOSED_INQUIRY_STATUSES.has(inquiry.status || ""));
}
