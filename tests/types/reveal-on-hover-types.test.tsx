import { RevealOnHover } from "@/components/ui/reveal-on-hover";

<>
  <RevealOnHover gap="md">
    <span>Item</span>
    <RevealOnHover.Action visible>
      <button type="button">Copy</button>
    </RevealOnHover.Action>
  </RevealOnHover>
  <RevealOnHover>
    {({ className }) => (
      <div className={className}>
        <RevealOnHover.Action>
          <button type="button">Copy</button>
        </RevealOnHover.Action>
      </div>
    )}
  </RevealOnHover>
  {/* @ts-expect-error Action only accepts visible and children. */}
  <RevealOnHover.Action gap="md">
    <button type="button">Copy</button>
  </RevealOnHover.Action>
</>;

export {};
