import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Loopix Client — Minecraft, Refined.";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: "#080A07",
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 78% 30%, rgba(163,230,53,0.14), transparent 70%)",
          color: "#F5F7F2",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="56" height="56" viewBox="0 0 32 32">
            <path
              d="M19.25 6.25 29 16 16 29 3 16 16 3 25.75 12.75"
              fill="none"
              stroke="#A3E635"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M22.5 7.3 24.7 9.5 22.5 11.7 20.3 9.5Z" fill="#A3E635" />
          </svg>
          <div style={{ fontSize: 26, letterSpacing: 4, color: "#A3AA9B", display: "flex" }}>
            LOOPIX CLIENT
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -3, display: "flex" }}>
            Minecraft,&nbsp;
            <span style={{ color: "#A3E635" }}>Refined.</span>
          </div>
          <div style={{ fontSize: 28, color: "#A3AA9B", display: "flex" }}>
            {siteConfig.description}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
