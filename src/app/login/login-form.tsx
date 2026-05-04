"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ brandDark }: { brandDark: string }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      setError("รหัสผ่านไม่ถูกต้อง");
      setPin("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div>
        <label className="text-xs text-gray-500 block mb-1">รหัส PIN</label>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="กรอก PIN 4-6 หลัก"
          maxLength={6}
          required
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-mono"
          autoFocus
        />
      </div>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <button
        type="submit"
        className="w-full py-3 rounded-xl text-white font-medium"
        style={{ background: brandDark }}
      >
        เข้าสู่ระบบ
      </button>
    </form>
  );
}
