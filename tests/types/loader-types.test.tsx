import { IndeterminateLoader } from "@/components/ui/loader";

export function LoaderTypeEvidence() {
  return (
    <IndeterminateLoader
      aria-label="Saving changes"
      className="loader"
      color="#123456"
      data-consumer="forwarded"
      style={{ color: "#abcdef", width: 240 }}
      variant="monochrome"
    />
  );
}
