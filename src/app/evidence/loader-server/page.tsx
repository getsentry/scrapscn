import { IndeterminateLoader } from "@/components/ui/loader";

export default function LoaderServerEvidencePage() {
  return (
    <main data-testid="loader-server">
      <IndeterminateLoader messages={["Loading on the server"]} />
    </main>
  );
}
