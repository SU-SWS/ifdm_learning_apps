import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'export',
    trailingSlash: true,
    basePath: '/ifdm_learning_apps', // 👈 important
    assetPrefix: '/ifdm_learning_apps', // 👈 important
};

export default nextConfig;
