export function writeDragItemId(dataTransfer: DataTransfer | null | undefined, itemId: string) {
  if (!dataTransfer) {
    return;
  }

  dataTransfer.effectAllowed = "move";
  dataTransfer.setData("text/plain", itemId);
}
