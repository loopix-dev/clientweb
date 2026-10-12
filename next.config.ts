import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents is intentionally off: the site is backed by a runtime
  // database (admin-managed content), so pages use normal static rendering
  // refreshed with revalidatePath() whenever the admin saves changes.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
