import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DashboardLoading from "./(dashboard)/dashboard/loading";
import FieldLoading from "./(kiosk)/agent/loading";

describe("route loading boundaries", () => {
  it("uses representative dashboard skeletons", () => {
    const html = renderToStaticMarkup(React.createElement(DashboardLoading));
    expect(html).toContain("data-dashboard-skeleton");
    expect(html).not.toContain("contour-transition-screen");
  });

  it("uses compact branded field feedback", () => {
    const html = renderToStaticMarkup(React.createElement(FieldLoading));
    expect(html).toContain("data-field-console");
    expect(html).toContain("Opening field workspace");
  });
});
