"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

type AdminNavLink = {
  href: string;
  label: string;
  icon?: string;
};

type AdminMobileMenuProps = {
  links: AdminNavLink[];
  dark: string;
  mint: string;
  accent: string;
};

export function AdminMobileMenu({ links, dark, mint, accent }: AdminMobileMenuProps) {
  const [open, setOpen] = useState(false);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        type="button"
        aria-label={open ? "ปิดเมนูแอดมิน" : "เปิดเมนูแอดมิน"}
        aria-expanded={open}
        aria-controls="admin-mobile-menu"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
        style={{ background: open ? `${accent}18` : "transparent" }}
      >
        <span className="relative h-5 w-5" aria-hidden="true">
          <span
            className={`absolute left-0 top-1 h-0.5 w-5 rounded-full transition-all duration-300 ease-out ${
              open ? "translate-y-1.5 rotate-45" : ""
            }`}
            style={{ background: open ? accent : mint }}
          />
          <span
            className={`absolute left-0 top-2.5 h-0.5 w-5 rounded-full transition-all duration-300 ease-out ${
              open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100"
            }`}
            style={{ background: mint }}
          />
          <span
            className={`absolute left-0 top-4 h-0.5 w-5 rounded-full transition-all duration-300 ease-out ${
              open ? "-translate-y-1.5 -rotate-45" : ""
            }`}
            style={{ background: open ? accent : mint }}
          />
        </span>
      </button>

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(0,0,0,0.6)", top: "56px" }}
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <div
        id="admin-mobile-menu"
        className={`fixed left-0 right-0 z-50 overflow-hidden transition-all duration-300 ease-out ${
          open
            ? "max-h-[calc(100vh-56px)] translate-y-0 opacity-100"
            : "max-h-0 -translate-y-3 opacity-0 pointer-events-none"
        }`}
        style={{ background: dark, top: "56px" }}
      >
        <div className="px-4 py-3 space-y-0.5 max-h-[calc(100vh-120px)] overflow-y-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 hover:bg-white/[0.07] active:scale-[0.98]"
              style={{ color: mint }}
            >
              {link.icon && (
                <span className="text-base opacity-70">
                  {iconEmoji(link.icon)}
                </span>
              )}
              {link.label}
            </Link>
          ))}

          {/* Divider */}
          <div className="my-2 mx-4 h-px" style={{ background: `${mint}15` }} />

          {/* Logout */}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 hover:bg-white/[0.07]"
            style={{ color: `${mint}88` }}
          >
            ออกจากระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}

function iconEmoji(icon: string): string {
  const map: Record<string, string> = {
    grid: "▦",
    list: "☰",
    device: "\u{1F4F1}",
    box: "\u{1F4E6}",
    users: "\u{1F465}",
    wrench: "\u{1F527}",
    chart: "\u{1F4CA}",
    file: "\u{1F4C4}",
    settings: "⚙️",
  };
  return map[icon] || "";
}
