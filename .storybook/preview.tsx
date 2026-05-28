import type { Preview } from '@storybook/nextjs-vite'
import '@fontsource/rubik/400.css'
import '@fontsource/rubik/500.css'
import '@fontsource/roboto-mono/400.css'
import '../src/app/globals.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo'
    },
    backgrounds: { disable: true },
  },
  decorators: [
    (Story) => (
      <div className="font-sans text-foreground bg-background p-6">
        <Story />
      </div>
    ),
  ],
};

export default preview;
