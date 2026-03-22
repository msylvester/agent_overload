import type { Metadata } from "next";
import localFont from "next/font/local";

const pressStart2P = localFont({
  src: "../../public/fonts/PressStart2P-Regular.ttf",
  variable: "--font-press-start",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Krystal Ball Z - Who Got Funded?",
  description:
    "A mystical AI-powered portal into the state of startup funding. Humans and agents welcome.",
};

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className={`${pressStart2P.variable}`}>{children}</div>;
}
