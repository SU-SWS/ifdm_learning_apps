import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'export',
    trailingSlash: true,
    basePath: process.env.NEXT_BASE_PATH || '',
    eslint: {
        // Directories to run ESLint on during builds
        dirs: ['app'],

        // Skip ESLint during builds (not recommended for production)
        ignoreDuringBuilds: false,
    },
    images: {
        unoptimized: true
    },
    generateBuildId: () => {
        return `build-${Date.now()}`
    }
};

export default nextConfig;
