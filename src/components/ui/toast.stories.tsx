import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";

import { Toast } from "./toast";

const meta = {
  component: Toast,
  title: "Scraps/Toast",
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

function ToastMatrix({ dark = false }: { dark?: boolean }) {
  const dismiss = () => undefined;
  return (
    <div className={dark ? "dark" : ""}>
      <div className="grid max-w-md gap-4 bg-[var(--background)] p-6 text-foreground">
        <Toast
          indicator={{
            id: "default",
            message: "Default message",
            options: {},
            type: "",
          }}
          onDismiss={dismiss}
        />
        <Toast
          indicator={{
            id: "loading",
            message: "Loading project settings",
            options: {},
            type: "loading",
          }}
          onDismiss={dismiss}
        />
        <Toast
          indicator={{
            id: "success",
            message: "Project settings saved",
            options: {},
            type: "success",
          }}
          onDismiss={dismiss}
        />
        <Toast
          indicator={{
            id: "error",
            message: "Could not save project settings",
            options: {},
            type: "error",
          }}
          onDismiss={dismiss}
        />
        <Toast
          indicator={{
            id: "undo",
            message: "Project deleted",
            options: { undo: () => undefined },
            type: "undo",
          }}
          onDismiss={dismiss}
        />
        <Toast
          indicator={{
            id: "success-undo",
            message: "Project deleted",
            options: { undo: () => undefined },
            type: "success",
          }}
          onDismiss={dismiss}
        />
        <Toast
          indicator={{
            id: "disabled",
            message: "Dismiss is disabled",
            options: { disableDismiss: true },
            type: "success",
          }}
          onDismiss={dismiss}
        />
        <Toast
          indicator={{
            id: "long",
            message:
              "This is a deliberately long toast message that truncates within its available width.",
            options: {},
            type: "error",
          }}
          onDismiss={dismiss}
        />
      </div>
    </div>
  );
}

export const VisualAcceptanceMatrix: Story = {
  parameters: {
    a11y: {
      config: { rules: [{ enabled: false, id: "svg-img-alt" }] },
    },
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      for (const toast of canvasElement.querySelectorAll<HTMLElement>(
        '[data-test-id="toast"], [data-test-id^="toast-"]',
      )) {
        expect(getComputedStyle(toast).opacity).toBe("1");
      }
    });
  },
  render: () => (
    <div className="grid gap-4">
      <ToastMatrix />
      <ToastMatrix dark />
    </div>
  ),
};
