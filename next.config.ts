import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'export',
    trailingSlash: true,
    basePath: '',
    images: {
        unoptimized: true
    },
    generateBuildId: () => {
        return `build-${Date.now()}`
    }
};

export default nextConfig;
