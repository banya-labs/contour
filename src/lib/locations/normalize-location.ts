export function normalizeLocation(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

export function cleanLocationValues(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const value of values) {
    const displayValue = value.trim().replace(/\s+/g, " ");
    const normalizedValue = normalizeLocation(displayValue);
    if (!normalizedValue || seen.has(normalizedValue)) continue;
    seen.add(normalizedValue);
    cleaned.push(displayValue);
  }

  return cleaned;
}

export function locationsEqual(left: string, right: string): boolean {
  return normalizeLocation(left) === normalizeLocation(right);
}
