"use client";

import Link from "next/link";
import { useState } from "react";

type AdminNavLink = {
  href: string;
  label: string;
};

type AdminMobileMenuProps = {
  links: AdminNavLink[];
  dark: string;
  mint: string;
};

export function AdminMobileMenu({ links, dark, mint }: AdminMobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "ปิดเมนูแอดมิน" : "เปิดเมนูแอดมิน"}
        aria-expanded={open}
        aria-controls="admin-mobile-menu"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
      >
        <span className="relative h-5 w-5" aria-hidden="true">
          <span
            className={`absolute left-0 top-1 h-0.5 w-5 rounded-full transition duration-200 ${
              open ? "translate-y-1.5 rotate-45" : ""
            }`}
            style={{ background: mint }}
          />
          <span
            className={`absolute left-0 top-2.5 h-0.5 w-5 rounded-full transition duration-200 ${
              open ? "opacity-0" : "opacity-100"
            }`}
            style={{ background: mint }}
          />
          <span
            className={`absolute left-0 top-4 h-0.5 w-5 rounded-full transition duration-200 ${
              open ? "-translate-y-1.5 -rotate-45" : ""
            }`}
            style={{ background: mint }}
          />
        </span>
      </button>

      <div
        id="admin-mobile-menu"
        className={`absolute left-0 right-0 top-full z-30 overflow-hidden border-t border-white/10 px-4 shadow-lg transition-all duration-200 ease-out ${
          open
            ? "max-h-96 translate-y-0 opacity-100"
            : "pointer-events-none max-h-0 -translate-y-2 opacity-0"
        }`}
        style={{ background: dark }}
      >
        <div className="flex flex-col gap-1 py-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              style={{ color: mint }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
