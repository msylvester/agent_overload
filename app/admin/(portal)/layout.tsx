"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/companies", label: "Companies" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/scrape", label: "Scrape Status" },
  { href: "/admin/settings", label: "Settings" },
];

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } finally {
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#05040a] text-[#f0e6d2] font-[var(--font-press-start),'Press_Start_2P',system-ui,sans-serif]">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden fixed top-3 left-3 z-50 border-2 border-[#474747] bg-[#141016] p-2 text-[#d4a853] text-xs"
      >
        {menuOpen ? "X" : "="}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static z-40 top-0 left-0 h-full w-56
          border-r-2 border-[#2b2b2b] bg-[#141016]
          flex flex-col transition-transform duration-200
          ${menuOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        `}
      >
        {/* Branding */}
        <div className="border-b-2 border-[#5c5c5c] px-3 py-4">
          <h1 className="text-[10px] tracking-[2px] text-[#d4a853] [text-shadow:0_0_10px_rgba(212,168,83,0.4)] text-center">
            KRYSTAL BALL Z
          </h1>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`
                  block px-4 py-3 text-[9px] tracking-[1px] transition-colors
                  ${active ? "bg-[#1c1520] text-[#d4a853] border-l-2 border-[#d4a853]" : "text-[#c0b896] hover:bg-[#1c1520] hover:text-[#f0e6d2] border-l-2 border-transparent"}
                `}
              >
                {item.label.toUpperCase()}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t-2 border-[#5c5c5c] px-3 py-4">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full text-[9px] tracking-[2px] text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
          >
            {loggingOut ? "LOGGING OUT..." : "LOGOUT"}
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        />
      )}

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
