type AssignmentPatch = { propertyId?: string | null; expectedPropertyId?: string | null };

export function inquiryAssignmentPatch(currentPropertyId: string | null | undefined, selectedPropertyId: string): AssignmentPatch {
  const previous = currentPropertyId || null;
  const next = selectedPropertyId || null;
  return previous === next ? {} : { propertyId: next, expectedPropertyId: previous };
}
