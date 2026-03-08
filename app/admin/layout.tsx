import type { Metadata } from "next";
import localFont from "next/font/local";

const pressStart2P = localFont({
  src: "../../public/fonts/PressStart2P-Regular.ttf",
  variable: "--font-press-start",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Krystal Ball Z - Admin",
  description: "Admin portal for Krystal Ball Z",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${pressStart2P.variable}`}>
      {children}
    </div>
  );
}
