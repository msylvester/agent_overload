import type { Metadata } from "next";
import localFont from "next/font/local";

const pressStart2P = localFont({
  src: "../../public/fonts/PressStart2P-Regular.ttf",
  variable: "--font-press-start",
  weight: "400",
});

export const metadata: Metadata = {
  title: "KBZ - Agent Onboarding",
  description:
    "Everything you need to onboard your AI agent to Krystal Ball Z",
};

export default function AgentOnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className={`${pressStart2P.variable}`}>{children}</div>;
}
