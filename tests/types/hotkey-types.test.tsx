import { Hotkey, Kbd, useHotkeys } from "@/components/ui/hotkey";

function TypeFixture() {
  useHotkeys([
    {
      callback: (event) => event.preventDefault(),
      enabled: true,
      includeInputs: true,
      match: ["mod+k", "escape"],
      skipPreventDefault: true,
    },
  ]);

  return (
    <>
      <Hotkey value="mod+k" />
      <Hotkey value={["mod+backspace", "delete"]} variant="debossed" />
      <Kbd className="custom" data-testid="key">Esc</Kbd>
      {/* @ts-expect-error The canonical variants are fixed. */}
      <Hotkey value="k" variant="flat" />
      {/* @ts-expect-error Hotkey requires a shortcut value. */}
      <Hotkey />
      {/* @ts-expect-error Match must be a string or string array. */}
      {useHotkeys([{ callback: () => {}, match: 1 }])}
    </>
  );
}

void TypeFixture;

export {};
