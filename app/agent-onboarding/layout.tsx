import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "KBZ - Agent Onboarding",
  description:
    "Install the @krystalballz/openclaw-funding-search plugin and connect your AI agent to Krystal Ball Z funding intelligence.",
};

export default function AgentOnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className={`${inter.variable}`}>{children}</div>;
}
