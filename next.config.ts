import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'export',
    trailingSlash: true,
    // basePath: '/ifdm_learning_apps',
    // assetPrefix: '/ifdm_learning_apps/',  // Add trailing slash
    images: {
        unoptimized: true  // Required for static export
    }
};

export default nextConfig;