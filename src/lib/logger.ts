import pino from "pino";

/** سجلات JSON منظمة؛ تُحجب بيانات التعريف الشخصية (PDPL) إن وُجدت في أي كائن مُسجَّل */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "test" ? "silent" : "info"),
  base: { service: "nmrievent" },
  redact: { paths: ["*.email", "*.phone", "*.name", "*.goals", "email", "phone", "name"], censor: "[REDACTED]" },
});
