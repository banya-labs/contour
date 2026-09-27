import { FLYER_CANVAS, FlyerAspectRatio } from "./flyer-render-model";

export function getFlyerExportDimensions(
  element: Pick<HTMLElement, "getBoundingClientRect">,
  aspectRatio: FlyerAspectRatio,
) {
  const bounds = element.getBoundingClientRect();
  const width = Math.round(bounds.width);
  const height = Math.round(bounds.height);
  const target = FLYER_CANVAS[aspectRatio];

  return {
    width,
    height,
    pixelRatio: target.width / width,
  };
}
