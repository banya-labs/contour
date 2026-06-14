export function buildSearchIndex(...values: unknown[]) {
  return values
    .flatMap((value) => {
      if (value === null || value === undefined) {
        return [];
      }

      return String(value);
    })
    .join(" ")
    .toLowerCase();
}
