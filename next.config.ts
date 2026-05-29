import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Storybook static build lives at public/storybook (relative asset paths).
      // Redirect the clean URL to index.html so those relative paths resolve.
      { source: "/storybook", destination: "/storybook/index.html", permanent: false },
    ]
  },
}

export default nextConfig;
