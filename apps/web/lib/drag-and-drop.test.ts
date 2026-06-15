import { describe, expect, it, vi } from "vitest";
import { writeDragItemId } from "./drag-and-drop";

describe("drag and drop helpers", () => {
  it("writes the dragged item id for drop targets", () => {
    const dataTransfer = {
      effectAllowed: "",
      setData: vi.fn(),
    } as unknown as DataTransfer;

    writeDragItemId(dataTransfer, "deal-123");

    expect(dataTransfer.effectAllowed).toBe("move");
    expect(dataTransfer.setData).toHaveBeenCalledWith("text/plain", "deal-123");
  });
});
