import { Image } from "@/components/ui/image";

export default function ImageServerConsumptionPage() {
  return (
    <main>
      <Image
        alt="Server image"
        radius="md"
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"
        width="240px"
      />
    </main>
  );
}
