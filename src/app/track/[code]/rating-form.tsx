"use client";

import { useState } from "react";

interface RatingFormProps {
  repairId: string;
  brandColors: {
    dark: string;
    accent: string;
    mint: string;
    teal: string;
    bg: string;
  };
}

export function RatingForm({ repairId, brandColors: c }: RatingFormProps) {
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (submitted) {
    return (
      <div className="text-center py-4">
        <p className="text-2xl mb-2">{"🎉"}</p>
        <p className="font-bold text-lg" style={{ color: c.dark }}>
          ขอบคุณสำหรับคะแนนค่ะ!
        </p>
        <p className="text-sm mt-1" style={{ color: c.teal }}>
          ความคิดเห็นของคุณช่วยให้เราพัฒนาบริการได้ดียิ่งขึ้น
        </p>
      </div>
    );
  }

  async function handleSubmit() {
    if (score === 0) {
      setError("กรุณาเลือกคะแนน");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repairId, score, comment: comment || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "เกิดข้อผิดพลาด");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("ไม่สามารถส่งคะแนนได้ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Star selector */}
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-1 transition-transform hover:scale-110 active:scale-95"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setScore(star)}
            aria-label={`${star} ดาว`}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill={star <= (hovered || score) ? "#FFD700" : "#D1D5DB"}
              stroke={star <= (hovered || score) ? "#FFD700" : "#D1D5DB"}
              strokeWidth="1"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>

      {score > 0 && (
        <p className="text-center text-sm mb-3" style={{ color: c.teal }}>
          {score === 1 && "ต้องปรับปรุง"}
          {score === 2 && "พอใช้"}
          {score === 3 && "ปานกลาง"}
          {score === 4 && "ดี"}
          {score === 5 && "ดีมาก!"}
        </p>
      )}

      {/* Comment */}
      <textarea
        className="w-full rounded-xl border p-3 text-sm resize-none focus:outline-none focus:ring-2"
        style={{
          borderColor: `${c.mint}44`,
          color: c.dark,
          background: `${c.dark}04`,
        }}
        rows={3}
        placeholder="ความคิดเห็นเพิ่มเติม (ไม่บังคับ)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      {error && (
        <p className="text-sm text-red-500 mt-2 text-center">{error}</p>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || score === 0}
        className="w-full mt-3 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        style={{ background: c.dark, color: "#fff" }}
      >
        {submitting ? "กำลังส่ง..." : "ส่งคะแนน"}
      </button>
    </div>
  );
}
