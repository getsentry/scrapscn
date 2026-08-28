import { StatusIndicator } from "@/components/ui/status-indicator";

<>
  <StatusIndicator animationIterationCount={3} aria-label="Online" variant="success" />
  {/* @ts-expect-error The canonical variants are fixed. */}
  <StatusIndicator variant="offline" />
  {/* @ts-expect-error Iteration count is numeric or infinite. */}
  <StatusIndicator animationIterationCount="three" variant="accent" />
</>;

export {};
