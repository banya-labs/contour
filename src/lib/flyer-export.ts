import { FLYER_CANVAS, FlyerAspectRatio } from "./flyer-render-model";

export function getFlyerExportDimensions(
  element: Pick<HTMLElement, "getBoundingClientRect">,
  aspectRatio: FlyerAspectRatio,
) {
  const bounds = element.getBoundingClientRect();
  const width = Math.round(bounds.width);
  const target = FLYER_CANVAS[aspectRatio];
  const height = Math.round((width * target.height) / target.width);

  return {
    width,
    height,
    pixelRatio: target.width / width,
  };
}
