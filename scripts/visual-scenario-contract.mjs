import { createHash } from "node:crypto";

import reviewTargets from "../tests/visual/canonical-review-targets.json" with { type: "json" };

export const visualViews = ["light-narrow", "light-wide", "dark-narrow", "dark-wide"];
export const visualEnvironment = {
  dimensions: { narrow: { height: 844, width: 390 }, wide: { height: 900, width: 1280 } },
  locale: "en-US",
  reducedMotion: "reduce",
};

// The source catalog records each public export explicitly. Only the first catalog page in a
// family has a matching module-level playground capture today. The other exports are scoped
// exclusions until a dedicated local scenario exists; they are not treated as evidence.
export const visualScenarioContract = Object.fromEntries(
  Object.entries(reviewTargets).map(([component, targets]) => {
    const primaryIndex = targets.findIndex((target) => target.capture !== false);
    return [
      component,
      {
        exclusions: targets.length
          ? []
          : [
              {
                reason:
                  "The pinned Scraps catalog has no direct story for this source-only family.",
              },
            ],
        scenarios: targets.map((target, index) => ({
          canonical: {
            route: `/organizations/{organization}/scraps/core/${target.slug}/`,
            selector: '[data-test-id="storybook-demo"]',
          },
          component,
          coverage:
            index === primaryIndex ? "module-level representative state" : "specific public export",
          id: `${component}--${target.slug}`,
          local: {
            path: "/",
            searchParams: {
              capture: "visual",
              component,
              theme: "{theme}",
              viewport: "{viewport}",
            },
            selector: '[data-slot="visual-capture"]',
          },
          target,
          views: visualViews,
          ...(target.capture === false || index !== primaryIndex
            ? {
                exclusion: {
                  reason:
                    target.reason ??
                    "The current module-level playground cannot isolate this export. A dedicated local scenario is required before it can be approved.",
                },
              }
            : {}),
        })),
      },
    ];
  }),
);

export function scenarioContractHash(contract = visualScenarioContract) {
  return createHash("sha256").update(JSON.stringify(contract)).digest("hex");
}

export function pairedScenarios(contract = visualScenarioContract) {
  return Object.values(contract).flatMap(({ scenarios }) =>
    scenarios.filter(({ exclusion }) => !exclusion),
  );
}
