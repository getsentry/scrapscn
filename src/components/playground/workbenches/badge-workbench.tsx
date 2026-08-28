"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import {
  AlertBadge,
  Badge,
  DeployBadge,
  FeatureBadge,
  ProjectsBadge,
  Tag,
} from "@/components/ui/badge";
import { PlaygroundLinkBehaviorProvider } from "@/components/ui/link-playground-adapter";

const components = ["badge", "tag", "feature", "alert", "deploy", "projects"] as const;
const badgeVariants = [
  "muted",
  "internal",
  "info",
  "success",
  "warning",
  "danger",
  "highlight",
  "promotion",
  "alpha",
  "beta",
  "new",
  "experimental",
] as const;
const tagVariants = ["muted", "info", "promotion", "danger", "warning", "success"] as const;
const featureTypes = ["alpha", "beta", "new", "experimental", "debug"] as const;
const alertStates = ["opened", "resolved", "warning", "critical", "issue", "disabled"] as const;

type State = {
  alertState: (typeof alertStates)[number];
  allProjects: boolean;
  badgeVariant: (typeof badgeVariants)[number];
  component: (typeof components)[number];
  environment: string;
  featureNested: boolean;
  featureType: (typeof featureTypes)[number];
  platforms: string;
  tagVariant: (typeof tagVariants)[number];
  withText: boolean;
};

const defaults = (): State => ({
  alertState: "resolved",
  allProjects: false,
  badgeVariant: "info",
  component: "badge",
  environment: "production",
  featureNested: false,
  featureType: "new",
  platforms: "python,javascript",
  tagVariant: "info",
  withText: true,
});

function finiteValue<const Values extends readonly string[]>(
  values: Values,
  value: string | null,
  fallback: Values[number],
): Values[number] {
  return values.find((candidate) => candidate === value) ?? fallback;
}

export function parseBadgeWorkbench(params: URLSearchParams): State {
  return {
    alertState: finiteValue(alertStates, params.get("badgeAlertState"), "resolved"),
    allProjects: params.get("badgeAllProjects") === "true",
    badgeVariant: finiteValue(badgeVariants, params.get("badgeVariant"), "info"),
    component: finiteValue(components, params.get("badgeComponent"), "badge"),
    environment: params.get("badgeEnvironment") ?? "production",
    featureNested: params.get("badgeFeatureNested") === "true",
    featureType: finiteValue(featureTypes, params.get("badgeFeatureType"), "new"),
    platforms: params.get("badgePlatforms") ?? "python,javascript",
    tagVariant: finiteValue(tagVariants, params.get("badgeTagVariant"), "info"),
    withText: params.get("badgeWithText") !== "false",
  };
}

export function serializeBadgeWorkbench(state: State) {
  return new URLSearchParams({
    badgeAlertState: state.alertState,
    badgeAllProjects: String(state.allProjects),
    badgeComponent: state.component,
    badgeEnvironment: state.environment,
    badgeFeatureNested: String(state.featureNested),
    badgeFeatureType: state.featureType,
    badgePlatforms: state.platforms,
    badgeTagVariant: state.tagVariant,
    badgeVariant: state.badgeVariant,
    badgeWithText: String(state.withText),
  });
}

const fieldClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

function SelectControl({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: readonly string[];
  value: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <select
        aria-label={label}
        className={fieldClassName}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function BadgePreview({
  dismissed,
  onDismiss,
  state,
}: {
  dismissed: boolean;
  onDismiss: () => void;
  state: State;
}) {
  if (state.component === "tag") {
    return dismissed ? (
      <button className="text-sm underline" onClick={onDismiss} type="button">
        Restore Tag
      </button>
    ) : (
      <Tag data-export="Tag" onDismiss={onDismiss} variant={state.tagVariant}>
        Tagged release
      </Tag>
    );
  }
  if (state.component === "feature") {
    const feature = <FeatureBadge type={state.featureType} />;
    return state.featureNested ? (
      <button data-export="FeatureBadge" type="button">
        Parent action {feature}
      </button>
    ) : (
      <div data-export="FeatureBadge">{feature}</div>
    );
  }
  if (state.component === "alert") {
    const status =
      state.alertState === "opened"
        ? 1
        : state.alertState === "warning"
          ? 10
          : state.alertState === "critical"
            ? 20
            : 2;
    return (
      <div data-export="AlertBadge">
        <AlertBadge
          isIssue={state.alertState === "issue"}
          status={status}
          withText={state.withText}
        />
      </div>
    );
  }
  if (state.component === "deploy") {
    return (
      <div data-export="DeployBadge">
        <DeployBadge
          deploy={{
            dateFinished: "2026-08-26T12:01:00Z",
            dateStarted: "2026-08-26T12:00:00Z",
            environment: state.environment,
            id: "deploy-1",
            name: "Production deploy",
            url: "https://example.com/deploys/1",
            version: "4.9.0 build (0.0.01)",
          }}
          orgSlug="sentry"
          projectId={1}
          version="4.9.0 build (0.0.01)"
        />
      </div>
    );
  }
  if (state.component === "projects") {
    const projectPlatforms = state.platforms
      .split(",")
      .map((platform) => platform.trim())
      .filter(Boolean);
    return (
      <div className="flex items-center gap-2" data-export="ProjectsBadge">
        <ProjectsBadge allProjects={state.allProjects} projectPlatforms={projectPlatforms} />
        <span>
          {projectPlatforms.length || (state.allProjects ? "All projects" : "My projects")}
        </span>
      </div>
    );
  }
  return (
    <Badge data-export="Badge" variant={state.badgeVariant}>
      Badge label
    </Badge>
  );
}

export function BadgeWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parseBadgeWorkbench(new URLSearchParams(sourceSearch)));
  const [dismissed, setDismissed] = useState(false);
  function update(next: State) {
    setState(next);
    setDismissed(false);
    onSearchChange(serializeBadgeWorkbench(next));
  }

  return children({
    breadcrumbs: ["Components", "Badge"],
    controls: (
      <div className="grid gap-4">
        <div>
          <h2 className="text-sm font-semibold">Badge setup</h2>
          <p className="text-xs text-muted-foreground">
            Exercise all six public exports from the canonical Badge module.
          </p>
        </div>
        <SelectControl
          label="Badge export"
          onChange={(value) =>
            update({ ...state, component: finiteValue(components, value, "badge") })
          }
          options={components}
          value={state.component}
        />
        {state.component === "badge" ? (
          <SelectControl
            label="Badge variant"
            onChange={(value) =>
              update({ ...state, badgeVariant: finiteValue(badgeVariants, value, "info") })
            }
            options={badgeVariants}
            value={state.badgeVariant}
          />
        ) : null}
        {state.component === "tag" ? (
          <SelectControl
            label="Tag variant"
            onChange={(value) =>
              update({ ...state, tagVariant: finiteValue(tagVariants, value, "info") })
            }
            options={tagVariants}
            value={state.tagVariant}
          />
        ) : null}
        {state.component === "feature" ? (
          <>
            <SelectControl
              label="Feature type"
              onChange={(value) =>
                update({ ...state, featureType: finiteValue(featureTypes, value, "new") })
              }
              options={featureTypes}
              value={state.featureType}
            />
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                aria-label="Nest in interactive parent"
                checked={state.featureNested}
                className="size-5"
                onChange={(event) => update({ ...state, featureNested: event.target.checked })}
                type="checkbox"
              />
              Nest in interactive parent
            </label>
          </>
        ) : null}
        {state.component === "alert" ? (
          <>
            <SelectControl
              label="Alert state"
              onChange={(value) =>
                update({ ...state, alertState: finiteValue(alertStates, value, "resolved") })
              }
              options={alertStates}
              value={state.alertState}
            />
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                aria-label="Show alert text"
                checked={state.withText}
                className="size-5"
                onChange={(event) => update({ ...state, withText: event.target.checked })}
                type="checkbox"
              />
              Show text
            </label>
          </>
        ) : null}
        {state.component === "deploy" ? (
          <label className="grid gap-1 text-sm">
            Environment
            <input
              aria-label="Deploy environment"
              className={fieldClassName}
              onChange={(event) => update({ ...state, environment: event.target.value })}
              value={state.environment}
            />
          </label>
        ) : null}
        {state.component === "projects" ? (
          <>
            <label className="grid gap-1 text-sm">
              Platform slugs
              <input
                aria-label="Project platforms"
                className={fieldClassName}
                onChange={(event) => update({ ...state, platforms: event.target.value })}
                value={state.platforms}
              />
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                aria-label="All projects"
                checked={state.allProjects}
                className="size-5"
                onChange={(event) => update({ ...state, allProjects: event.target.checked })}
                type="checkbox"
              />
              All projects fallback
            </label>
          </>
        ) : null}
      </div>
    ),
    description:
      "Test Badge and Tag variants, feature focus tooltips, alert precedence, deploy links, and project platform glyphs.",
    preview: (
      <PlaygroundLinkBehaviorProvider>
        <div
          className="grid min-h-72 place-items-center rounded-md border border-border"
          data-testid="badge-preview"
        >
          <BadgePreview
            dismissed={dismissed}
            onDismiss={() => setDismissed((value) => !value)}
            state={state}
          />
        </div>
      </PlaygroundLinkBehaviorProvider>
    ),
    reset: () => {
      const next = defaults();
      setState(next);
      setDismissed(false);
      return serializeBadgeWorkbench(next);
    },
    serialize: () => serializeBadgeWorkbench(state),
    title: "Badge",
  });
}
