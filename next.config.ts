import type { NextConfig } from "next";
import withFlowbiteReact from "flowbite-react/plugin/nextjs";
import BASE_URL from "./src/app/urlConfig/urlConfig";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Serve account logos on the frontend origin so invoice PDF capture can include them.
  async rewrites() {
    return [
      {
        source: "/account-logos/:filename([a-zA-Z0-9_-]+\\.(?:jpe?g|png|gif|webp|JPE?G|PNG|GIF|WEBP))",
        destination: `${new URL(BASE_URL).origin}/logo_uploads/:filename`,
      },
    ];
  },
};

export default withFlowbiteReact(nextConfig);
