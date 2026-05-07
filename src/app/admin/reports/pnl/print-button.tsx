"use client";

export function PrintButton({ dark, accent }: { dark: string; accent: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="text-xs px-4 py-2.5 rounded-xl font-bold transition-all hover:opacity-90 print:hidden"
      style={{ background: accent, color: dark }}
    >
      Export PDF
    </button>
  );
}
