import { describe, expect, it, vi } from "vitest";
import { readKanbanDragItem, writeKanbanDragItem } from "./kanban-dnd";

describe("kanban drag and drop helpers", () => {
  it("writes the dragged item id for the browser drop payload", () => {
    const dataTransfer = {
      effectAllowed: "",
      setData: vi.fn(),
    } as unknown as DataTransfer;

    writeKanbanDragItem(dataTransfer, "deal-123");

    expect(dataTransfer.effectAllowed).toBe("move");
    expect(dataTransfer.setData).toHaveBeenCalledWith("text/plain", "deal-123");
  });

  it("falls back to component drag state when the browser payload is empty", () => {
    const dataTransfer = {
      getData: vi.fn().mockReturnValue(""),
    } as unknown as DataTransfer;

    expect(readKanbanDragItem(dataTransfer, "deal-123")).toBe("deal-123");
  });
});
