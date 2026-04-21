export function extractInstitutionRollNumber(value?: string | null) {
  if (!value) {
    return "";
  }

  const normalized = value.trim().toUpperCase();
  const emailPrefix = normalized.split("@")[0];
  const candidate = emailPrefix || normalized;

  return /^[0-9]{2}WH[0-9]A[0-9]{4}$/i.test(candidate) ? candidate.toUpperCase() : "";
}

export function inferNameFromEmail(value?: string | null) {
  if (!value) {
    return "";
  }

  const prefix = value.split("@")[0]?.trim();

  if (!prefix) {
    return "";
  }

  return prefix.toUpperCase();
}
