import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ContourSunLoader } from "./contour-sun-loader";
import { PendingButtonContent } from "./pending-button-content";
import { ContourTransitionScreen } from "./contour-transition-screen";

describe("Contour loading feedback", () => {
  it("announces a non-decorative sun loader", () => {
    const html = renderToStaticMarkup(
      createElement(ContourSunLoader, { label: "Publishing property" }),
    );

    expect(html).toContain('role="status"');
    expect(html).toContain("Publishing property");
    expect(html).toContain("contour-sun-loader");
  });

  it("does not duplicate status text for a decorative loader", () => {
    const html = renderToStaticMarkup(
      createElement(ContourSunLoader, { label: "Saving", decorative: true }),
    );

    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="status"');
  });

  it("keeps pending button copy explicit", () => {
    const html = renderToStaticMarkup(
      createElement(
        PendingButtonContent,
        { pending: true, pendingLabel: "Saving client changes" },
        "Save Changes",
      ),
    );

    expect(html).toContain("Saving client changes");
    expect(html).not.toContain(">Save Changes<");
  });

  it("renders a blocking transition as an announced busy region", () => {
    const html = renderToStaticMarkup(
      createElement(ContourTransitionScreen, {
        label: "Creating your account",
        description: "Preparing your workspace.",
      }),
    );

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Creating your account");
    expect(html).toContain("Preparing your workspace.");
  });
});
