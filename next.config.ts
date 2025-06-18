import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'export',
    trailingSlash: true,
    basePath: '',
    images: {
        unoptimized: true
    },
    assetPrefix: undefined,
    generateBuildId: async () => {
        return Date.now().toString()
    }
};

export default nextConfig;
