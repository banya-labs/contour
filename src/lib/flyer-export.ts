import { FLYER_CANVAS, FlyerAspectRatio } from "./flyer-render-model";

export function getFlyerExportDimensions(
  element: { getBoundingClientRect(): Pick<DOMRect, "width" | "height"> },
  aspectRatio: FlyerAspectRatio,
) {
  const bounds = element.getBoundingClientRect();
  const width = Math.round(bounds.width);
  const sourceHeight = Math.round(bounds.height);
  const target = FLYER_CANVAS[aspectRatio];

  return {
    width,
    sourceHeight,
    canvasWidth: target.width,
    canvasHeight: target.height,
  };
}
