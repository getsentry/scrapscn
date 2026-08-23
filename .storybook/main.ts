import type { StorybookConfig } from '@storybook/nextjs-vite';
import prismComponents from 'prismjs/components.js';

const prismLanguages = Object.keys(prismComponents.languages)
  .filter(language => language !== 'meta')
  .map(language => `prismjs/components/prism-${language}.min.js`);

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp"
  ],
  "framework": "@storybook/nextjs-vite",
  "staticDirs": [
    "../public"
  ],
  viteFinal: async config => ({
    ...config,
    optimizeDeps: {
      ...config.optimizeDeps,
      include: [
        ...(config.optimizeDeps?.include ?? []),
        "prismjs",
        ...prismLanguages,
      ],
    },
  }),
};
export default config;
