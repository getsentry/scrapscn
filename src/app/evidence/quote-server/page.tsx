import { Quote } from "@/components/ui/quote";

const quoteCases = [
  { id: "absent", source: undefined },
  { id: "empty", source: {} },
  { id: "href-only", source: { href: "https://example.com/href-only" } },
  { id: "author-only", source: { author: "Ada" } },
  { id: "label-only", source: { label: "Notes" } },
  {
    id: "full",
    source: { author: "Ada", href: "https://example.com/full", label: "Notes" },
  },
] as const;

export default function QuoteServerConsumptionPage() {
  return (
    <main className="grid gap-6 p-6">
      {quoteCases.map((quoteCase) => (
        <section data-testid={`server-quote-${quoteCase.id}`} key={quoteCase.id}>
          {quoteCase.source === undefined ? (
            <Quote>Server-rendered regular Scraps quotation.</Quote>
          ) : (
            <Quote source={quoteCase.source}>
              Server-rendered regular Scraps quotation.
            </Quote>
          )}
        </section>
      ))}
    </main>
  );
}
