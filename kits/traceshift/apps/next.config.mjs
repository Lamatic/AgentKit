import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The required Lamatic kit config lives one directory above the Next app.
  // On Vercel, enable parent-source access in the Root Directory dashboard setting.
  turbopack: {
    root: path.resolve(currentDirectory, ".."),
  },
};

export default nextConfig;
