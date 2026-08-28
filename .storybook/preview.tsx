import type { Preview } from "@storybook/nextjs-vite";

import "@fontsource/rubik/400.css";
import "@fontsource/rubik/500.css";
import "../src/components/ui/roboto-mono.css";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "error",
    },
    backgrounds: { disable: true },
  },
  decorators: [
    (Story) => (
      <div className="bg-background p-6 font-sans text-foreground">
        <Story />
      </div>
    ),
  ],
};

export default preview;
