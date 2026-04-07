const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverMinification: false,
  },
  webpack: (config) => {
    config.externals = [
      ...(config.externals || []),
      "@opentelemetry/sdk-node",
      "@genkit-ai/firebase",
      "@genkit-ai/googleai",
      "genkit"
    ];
    // Disable minification to bypass crashes
    config.optimization.minimize = false;
    return config;
  }
};

export default nextConfig;
