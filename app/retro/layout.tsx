import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mike Ess - AI Builder & Systems Thinker",
  description: "I build AI systems, experimental products, and media about the future of software.",
};

export default function RetroLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
