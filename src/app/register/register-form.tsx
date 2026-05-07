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

export function RegisterForm({ colors }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (password.length < 4) {
      setError("รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร");
      return;
    }

    setLoading(true);
    try {
      const regRes = await fetch("/api/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password }),
      });
      if (!regRes.ok) {
        const data = await regRes.json();
        setError(data.error?.includes("409") ? "เบอร์โทรนี้ถูกใช้แล้ว" : data.error || "สมัครไม่สำเร็จ");
        return;
      }

      // Auto-login after registration
      const loginRes = await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      if (loginRes.ok) {
        router.push("/my-repairs");
        return;
      }

      // Registration succeeded but auto-login failed — redirect to login
      router.push("/login");
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
          <label htmlFor="reg-name" className="block text-sm font-medium mb-1.5" style={{ color: colors.mint }}>
            ชื่อ-นามสกุล
          </label>
          <input
            id="reg-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="สมชาย ใจดี"
            required
            autoFocus
            className="w-full rounded-xl border-0 px-4 py-3.5 text-base text-white placeholder-gray-500 outline-none transition focus:ring-2"
            style={{ backgroundColor: colors.dark, outlineColor: colors.accent }}
          />
        </div>
        <div>
          <label htmlFor="reg-phone" className="block text-sm font-medium mb-1.5" style={{ color: colors.mint }}>
            เบอร์โทร
          </label>
          <input
            id="reg-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0812345678"
            required
            className="w-full rounded-xl border-0 px-4 py-3.5 text-base text-white placeholder-gray-500 outline-none transition focus:ring-2"
            style={{ backgroundColor: colors.dark, outlineColor: colors.accent }}
          />
        </div>
        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium mb-1.5" style={{ color: colors.mint }}>
            รหัสผ่าน
          </label>
          <input
            id="reg-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            required
            className="w-full rounded-xl border-0 px-4 py-3.5 text-base text-white placeholder-gray-500 outline-none transition focus:ring-2"
            style={{ backgroundColor: colors.dark, outlineColor: colors.accent }}
          />
        </div>
        <div>
          <label htmlFor="reg-confirm" className="block text-sm font-medium mb-1.5" style={{ color: colors.mint }}>
            ยืนยันรหัสผ่าน
          </label>
          <input
            id="reg-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="password"
            required
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
        {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
      </button>
    </form>
  );
}
