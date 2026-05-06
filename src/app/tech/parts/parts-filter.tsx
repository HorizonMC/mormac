"use client";

import { useState } from "react";

type Part = {
  id: string;
  name: string;
  category: string;
  sku: string;
  quantity: number;
  costPrice: number;
  alertAt: number;
};

type Props = {
  parts: Part[];
  dark: string;
  teal: string;
  accent: string;
};

function qtyColor(qty: number): { bg: string; text: string } {
  if (qty < 3) return { bg: "#FEE2E2", text: "#991B1B" };
  if (qty < 5) return { bg: "#FEF3C7", text: "#92400E" };
  return { bg: "#DCFCE7", text: "#166534" };
}

export function PartsFilter({ parts, dark, teal, accent }: Props) {
  const [search, setSearch] = useState("");

  const filtered = parts.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <input
        type="text"
        placeholder="ค้นหาอะไหล่..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2"
        style={{ "--tw-ring-color": teal } as any}
      />

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-gray-400">ไม่พบอะไหล่</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((p) => {
            const qty = qtyColor(p.quantity);
            return (
              <div
                key={p.id}
                className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4"
              >
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="font-medium text-sm" style={{ color: dark }}>{p.name}</p>
                    {p.category && (
                      <p className="text-xs text-gray-400 mt-0.5">{p.category}</p>
                    )}
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                    style={{ background: qty.bg, color: qty.text }}
                  >
                    คงเหลือ {p.quantity}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                  {p.sku && <span>SKU: {p.sku}</span>}
                  <span className="font-medium" style={{ color: teal }}>
                    ฿{p.costPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
