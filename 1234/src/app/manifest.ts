import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.brand.titleSuffix,
    short_name: siteConfig.brand.name,
    description: siteConfig.brand.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f3eee3",
    theme_color: "#15803d",
  };
}
