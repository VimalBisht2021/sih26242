import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.NEXT_STANDALONE === 'true' ? 'standalone' : undefined,
  outputFileTracingRoot: path.resolve(__dirname, '../../'),
  transpilePackages: [
    '@sih26242/contracts',
    '@sih26242/domain',
    '@sih26242/shared',
    '@sih26242/qualification'
  ]
};

export default nextConfig;

