"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  colors: {
    dark: string;
    accent: string;
    mint: string;
    teal: string;
  };
}

export function LoginForm({ colors }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Try admin login first
      const adminRes = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (adminRes.ok) {
        router.push("/admin");
        return;
      }

      // Try tech login
      const techRes = await fetch("/api/tech/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (techRes.ok) {
        router.push("/tech");
        return;
      }

      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      setPassword("");
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: `${colors.teal}18` }}
      >
        <div>
          <label htmlFor="login-username" className="block text-sm font-medium mb-1.5" style={{ color: colors.mint }}>
            ชื่อผู้ใช้
          </label>
          <input
            id="login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            required
            autoComplete="username"
            autoFocus
            className="w-full rounded-xl border-0 px-4 py-3.5 text-base text-white placeholder-gray-500 outline-none transition focus:ring-2"
            style={{ backgroundColor: colors.dark, outlineColor: colors.accent }}
          />
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium mb-1.5" style={{ color: colors.mint }}>
            รหัสผ่าน
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            required
            autoComplete="current-password"
            className="w-full rounded-xl border-0 px-4 py-3.5 text-base text-white placeholder-gray-500 outline-none transition focus:ring-2"
            style={{ backgroundColor: colors.dark, outlineColor: colors.accent }}
          />
        </div>
      </div>

      {error && <p className="text-center text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl py-3.5 text-base font-bold transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        style={{ backgroundColor: colors.accent, color: colors.dark }}
      >
        {loading ? "กำลังเข้าสู่ระบบ..." : "Login"}
      </button>
    </form>
  );
}
