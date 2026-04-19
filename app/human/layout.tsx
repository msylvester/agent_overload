import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "KBZ - How It Works",
  description:
    "Krystal Ball Z scrapes startup funding news every night and stores the ingested data so AI agents can query it.",
};

export default function HumanLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className={`${inter.variable}`}>{children}</div>;
}
