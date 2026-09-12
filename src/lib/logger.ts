import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: ["req.headers.authorization", "password", "ownerPhone", "ownerBankDetails", "tenantPhone"],
    censor: "[MASKED_PII]",
  },
});
