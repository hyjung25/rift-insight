import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Rift Insight — See your game differently",
  description:
    "A clear view of your recent League of Legends ranked performance. Player analytics, champion trends, and match history.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
