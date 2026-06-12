export function getLaunchTarget() {
  return process.env.CONTOUR_WEB_URL ?? "http://localhost:3000";
}
