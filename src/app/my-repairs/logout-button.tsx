"use client";

import { useRouter } from "next/navigation";

export function LogoutButton({ accent, dark }: { accent: string; dark: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/customer/auth", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs font-bold px-4 py-2 rounded-xl transition hover:scale-[1.02]"
      style={{ background: `${accent}20`, color: accent }}
    >
      ออกจากระบบ
    </button>
  );
}
