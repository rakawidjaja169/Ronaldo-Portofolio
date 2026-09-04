/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dokploy (Docker) needs standalone output; Vercel ignores it.
  output: "standalone",
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
}

export default nextConfig
