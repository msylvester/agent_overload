import type { Metadata } from "next";
import localFont from "next/font/local";

const pressStart2P = localFont({
  src: "../../public/fonts/PressStart2P-Regular.ttf",
  variable: "--font-press-start",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Krystal Ball Z - AI Agent Chat",
  description: "A mystical fortune teller powered by AI",
};

export default function RetroLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className={`${pressStart2P.variable}`}>{children}</div>;
}
