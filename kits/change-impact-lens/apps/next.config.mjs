/** @type {import('next').NextConfig} */
const nextConfig = {
typescript: {
ignoreBuildErrors: true,
},
images: {
unoptimized: true,
},
serverExternalPackages: ["madge"],
}
export default nextConfig
