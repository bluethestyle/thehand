import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "더핸드 디지털 메뉴판",
    short_name: "더핸드",
    description: "사케 바 더핸드 — 페이지형 디지털 메뉴판",
    start_url: "/",
    display: "fullscreen", // 브라우저 UI 없이 전체화면 (태블릿 키오스크)
    orientation: "portrait",
    background_color: "#111418",
    theme_color: "#111418",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
