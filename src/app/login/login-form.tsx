"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ brandDark }: { brandDark: string }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      setPassword("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div>
        <label className="text-xs text-gray-500 block mb-1">ชื่อผู้ใช้</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          required
          autoComplete="username"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm"
          autoFocus
        />
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">รหัสผ่าน</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          required
          autoComplete="current-password"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm"
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
