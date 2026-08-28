import {
  AlertBadge,
  Badge,
  DeployBadge,
  FeatureBadge,
  ProjectsBadge,
  Tag,
  type FeatureBadgeProps,
  type TagProps,
} from "../../src/components/ui/badge";

const emotionLike = { name: "tooltip", styles: "color: red", next: undefined };

const tagProps: TagProps = {
  variant: "warning",
  icon: <svg />,
  onDismiss: () => undefined,
};
const featureProps: FeatureBadgeProps = {
  type: "experimental",
  tooltipProps: { position: "left", title: "Custom" },
};
const deploy = {
  dateFinished: "2026-08-26T12:01:00Z",
  dateStarted: "2026-08-26T12:00:00Z",
  environment: "production",
  id: "deploy-1",
  name: "Production deploy",
  url: "https://example.com/deploys/1",
  version: "1.2.3",
};

<Badge variant="muted">Muted</Badge>;
<Badge variant="internal">Internal</Badge>;
<Badge variant="info">Info</Badge>;
<Badge variant="success">Success</Badge>;
<Badge variant="warning">Warning</Badge>;
<Badge variant="danger">Danger</Badge>;
<Badge variant="highlight">Highlight</Badge>;
<Badge variant="promotion">Promotion</Badge>;
<Badge variant="alpha">Alpha</Badge>;
<Badge variant="beta">Beta</Badge>;
<Badge variant="new">New</Badge>;
<Badge variant="experimental">Experimental</Badge>;
<Tag {...tagProps}>Status</Tag>;
<FeatureBadge {...featureProps} />;
// @ts-expect-error FeatureBadge inherits the portable Tooltip overlayStyle boundary.
<FeatureBadge type="alpha" tooltipProps={{ overlayStyle: emotionLike }} />;
<FeatureBadge type="alpha" />;
<FeatureBadge type="beta" />;
<FeatureBadge type="new" />;
<FeatureBadge type="debug" />;
<AlertBadge status={1} />;
<AlertBadge status={2} withText />;
<AlertBadge status={10} />;
<AlertBadge status={20} />;
<AlertBadge isIssue />;
// @ts-expect-error AlertBadge no longer supports a disabled status.
<AlertBadge isDisabled />;
<DeployBadge deploy={deploy} orgSlug="sentry" projectId={1} version="1.2.3" />;
<ProjectsBadge projectPlatforms={["python", "javascript"]} />;
<ProjectsBadge allProjects projectPlatforms={[]} />;

// @ts-expect-error Badge requires a variant.
<Badge>Missing</Badge>;
// @ts-expect-error Badge has no debug variant.
<Badge variant="debug">Debug</Badge>;
// @ts-expect-error Tag has no highlight variant.
<Tag variant="highlight">Highlight</Tag>;
// @ts-expect-error FeatureBadge has five finite types.
<FeatureBadge type="deprecated" />;
// @ts-expect-error FeatureBadge owns the hoverable tooltip behavior.
<FeatureBadge type="new" tooltipProps={{ isHoverable: false }} />;
// @ts-expect-error FeatureBadge owns wrapper behavior.
<FeatureBadge type="new" tooltipProps={{ skipWrapper: false }} />;
// @ts-expect-error AlertBadge accepts only IncidentStatus values.
<AlertBadge status={3} />;
// @ts-expect-error DeployBadge projectId is numeric.
<DeployBadge deploy={deploy} orgSlug="sentry" projectId="1" version="1.2.3" />;
<DeployBadge
  // @ts-expect-error DeployBadge requires the complete canonical Deploy shape.
  deploy={{ environment: "production" }}
  orgSlug="sentry"
  projectId={1}
  version="1.2.3"
/>;
// @ts-expect-error ProjectsBadge requires the platform list.
<ProjectsBadge />;
