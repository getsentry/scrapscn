import { EmptyState } from "@/components/ui/empty-state";

export default function EmptyStateServerEvidencePage() {
  return (
    <EmptyState
      data-testid="empty-state-server"
      description="Server rendered."
      title="No results"
    />
  );
}
