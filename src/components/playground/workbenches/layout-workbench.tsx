"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Container, Flex, Grid, Stack, Surface } from "@/components/ui/layout";

const gaps = ["xs", "sm", "md", "lg"] as const;
const surfaceVariants = ["primary", "secondary", "tertiary"] as const;
type LayoutGap = (typeof gaps)[number];
type LayoutSurface = (typeof surfaceVariants)[number];

interface LayoutWorkbenchState {
  columns: 2 | 3;
  gap: LayoutGap;
  surface: LayoutSurface;
}

function defaultState(): LayoutWorkbenchState {
  return { columns: 3, gap: "md", surface: "primary" };
}

function parseGap(value: string | null): LayoutGap {
  return gaps.find((gap) => gap === value) ?? "md";
}

function parseSurface(value: string | null): LayoutSurface {
  return surfaceVariants.find((surface) => surface === value) ?? "primary";
}

export function parseLayoutWorkbench(params: URLSearchParams): LayoutWorkbenchState {
  return {
    columns: params.get("layoutColumns") === "2" ? 2 : 3,
    gap: parseGap(params.get("layoutGap")),
    surface: parseSurface(params.get("layoutSurface")),
  };
}

export function serializeLayoutWorkbench(state: LayoutWorkbenchState) {
  return new URLSearchParams({
    layoutColumns: String(state.columns),
    layoutGap: state.gap,
    layoutSurface: state.surface,
  });
}

export function LayoutWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parseLayoutWorkbench(new URLSearchParams(sourceSearch)));

  function update(next: LayoutWorkbenchState) {
    setState(next);
    onSearchChange(serializeLayoutWorkbench(next));
  }

  const controlClassName =
    "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";
  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Layout setup</h2>
        <p className="text-xs text-muted-foreground">Changes stay in the share URL.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">
          Grid columns
          <select
            aria-label="Layout grid columns"
            className={controlClassName}
            value={state.columns}
            onChange={(event) => update({ ...state, columns: event.target.value === "2" ? 2 : 3 })}
          >
            <option value="2">Two</option>
            <option value="3">Three</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Gap
          <select
            aria-label="Layout gap"
            className={controlClassName}
            value={state.gap}
            onChange={(event) => update({ ...state, gap: parseGap(event.target.value) })}
          >
            {gaps.map((gap) => (
              <option key={gap} value={gap}>
                {gap}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Surface
          <select
            aria-label="Layout surface"
            className={controlClassName}
            value={state.surface}
            onChange={(event) => update({ ...state, surface: parseSurface(event.target.value) })}
          >
            {surfaceVariants.map((surface) => (
              <option key={surface} value={surface}>
                {surface}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );

  const cards = [
    ["Unresolved", "128"],
    ["For review", "24"],
    ["Resolved", "1,204"],
  ] as const;
  const preview = (
    <Container
      containerType="inline-size"
      data-testid="layout-workbench-preview"
      maxWidth="1200px"
      width="100%"
    >
      <Stack gap={state.gap}>
        <Flex align="center" gap="sm" justify="between" wrap="wrap">
          <Stack gap="xs">
            <span className="text-lg font-semibold">Project health</span>
            <span className="text-sm text-muted-foreground">
              Container, Flex, Grid, Stack, and Surface in one composition.
            </span>
          </Stack>
          <Surface padding="sm md" radius="md" variant="overlay">
            <span className="text-sm font-medium">Last 24 hours</span>
          </Surface>
        </Flex>
        <Grid
          columns={{ zero: "1fr", md: `repeat(${state.columns}, minmax(0, 1fr))` }}
          gap={state.gap}
        >
          {cards.slice(0, state.columns).map(([label, value]) => (
            <Surface
              className="border border-border"
              key={label}
              padding="lg"
              radius="md"
              variant={state.surface}
            >
              <Stack gap="sm">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-3xl font-semibold tabular-nums">{value}</span>
              </Stack>
            </Surface>
          ))}
        </Grid>
        <Surface className="border border-border" padding="md" radius="md" variant={state.surface}>
          <Stack gap="sm">
            <Flex align="center" justify="between">
              <span className="text-sm font-semibold">Recent activity</span>
              <span className="text-xs text-muted-foreground">Composed with Flex</span>
            </Flex>
            <Stack.Separator />
            <Grid columns="minmax(0, 1fr) auto" gap="sm" align="center">
              <span className="truncate text-sm">TypeError in checkout flow</span>
              <span className="text-xs text-muted-foreground">2 minutes ago</span>
              <span className="truncate text-sm">API request exceeded 5 seconds</span>
              <span className="text-xs text-muted-foreground">18 minutes ago</span>
            </Grid>
          </Stack>
        </Surface>
      </Stack>
    </Container>
  );

  return children({
    breadcrumbs: ["Components", "Layout"],
    controls,
    description: "Compose responsive Scraps layout primitives and tune their shared spacing.",
    preview,
    reset: () => {
      const next = defaultState();
      setState(next);
      return serializeLayoutWorkbench(next);
    },
    serialize: () => serializeLayoutWorkbench(state),
    title: "Layout",
  });
}
