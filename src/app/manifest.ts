import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RuledOff",
    short_name: "RuledOff",
    description:
      "Collect everything blocking your month-end close and chase your client automatically, until every item is ruled off.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFDF7",
    theme_color: "#1E3A5F",
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
      },
    ],
  };
}
