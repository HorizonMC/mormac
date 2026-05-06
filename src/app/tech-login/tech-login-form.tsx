"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Props {
  colors: {
    dark: string;
    teal: string;
    accent: string;
    mint: string;
    bg: string;
  };
}

export function TechLoginForm({ colors }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/tech/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }

      router.push("/tech");
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
        style={{ backgroundColor: colors.teal + "18" }}
      >
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium mb-1.5"
            style={{ color: colors.mint }}
          >
            ชื่อผู้ใช้
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border-0 px-4 py-3 text-base text-white placeholder-gray-500 outline-none focus:ring-2"
            style={{
              backgroundColor: colors.dark,
              outlineColor: colors.accent,
            }}
            placeholder="username"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium mb-1.5"
            style={{ color: colors.mint }}
          >
            รหัสผ่าน
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border-0 px-4 py-3 text-base text-white placeholder-gray-500 outline-none focus:ring-2"
            style={{
              backgroundColor: colors.dark,
              outlineColor: colors.accent,
            }}
            placeholder="password"
          />
        </div>
      </div>

      {error && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl py-3.5 text-base font-semibold transition-opacity disabled:opacity-50"
        style={{
          backgroundColor: colors.accent,
          color: colors.dark,
        }}
      >
        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
