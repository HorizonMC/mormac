"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type TechNavProps = {
  dark: string;
  teal: string;
  accent: string;
  mint: string;
};

export function TechNav({ dark, teal, accent, mint }: TechNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { href: "/tech", label: "งานของฉัน", icon: WrenchIcon },
    { href: "/tech/parts", label: "อะไหล่", icon: BoxIcon },
  ];

  async function handleLogout() {
    await fetch("/api/tech/auth", { method: "DELETE" });
    router.push("/tech/login");
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t px-2 py-1 safe-area-bottom"
      style={{ background: dark, borderColor: "rgba(255,255,255,0.1)" }}
    >
      {tabs.map((tab) => {
        const active = tab.href === "/tech" ? pathname === "/tech" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center gap-0.5 px-4 py-2 text-xs transition-colors"
            style={{ color: active ? accent : mint }}
          >
            <tab.icon size={22} />
            <span className="font-medium">{tab.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={handleLogout}
        className="flex flex-col items-center gap-0.5 px-4 py-2 text-xs transition-colors"
        style={{ color: mint }}
      >
        <LogoutIcon size={22} />
        <span className="font-medium">ออกจากระบบ</span>
      </button>
    </nav>
  );
}

function WrenchIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function BoxIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function LogoutIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
