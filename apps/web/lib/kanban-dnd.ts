export function writeKanbanDragItem(dataTransfer: DataTransfer | null | undefined, itemId: string) {
  if (!dataTransfer) {
    return;
  }

  dataTransfer.effectAllowed = "move";
  dataTransfer.setData("text/plain", itemId);
}

export function readKanbanDragItem(
  dataTransfer: DataTransfer | null | undefined,
  fallbackItemId: string | null,
) {
  const droppedItemId = dataTransfer?.getData("text/plain").trim();
  return droppedItemId || fallbackItemId;
}
