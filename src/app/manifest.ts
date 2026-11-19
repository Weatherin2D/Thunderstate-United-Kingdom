import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Thunderstate UK",
    short_name: "Thunderstate UK",
    description:
      "Live weather, radar and forecast tools for the UK and Europe.",
    start_url: "/",
    display: "standalone",
    background_color: "#070b16",
    theme_color: "#070b16",
    orientation: "any",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
