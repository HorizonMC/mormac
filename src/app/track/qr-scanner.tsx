"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function QrScanner({ dark, teal, accent }: { dark: string; teal: string; accent: string }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<any>(null);
  const router = useRouter();

  function isLineApp() {
    return /Line\//i.test(navigator.userAgent);
  }

  async function startScanner() {
    if (isLineApp()) {
      const url = window.location.href.split("#")[0];
      const sep = url.includes("?") ? "&" : "?";
      window.location.href = url + sep + "openExternalBrowser=1";
      return;
    }

    setScanning(true);
    setError("");
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader");
    html5QrRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          scanner.stop().catch(() => {});
          setScanning(false);
          const match = decodedText.match(/MOR-\d{4}-\d{4}/);
          if (match) {
            router.push(`/track/${match[0]}`);
          } else if (decodedText.includes("/track/")) {
            const url = new URL(decodedText);
            router.push(url.pathname);
          } else {
            setError("QR Code ไม่ใช่เลขซ่อม กรุณาสแกนใหม่");
          }
        },
        () => {},
      );
    } catch {
      setScanning(false);
      setError("ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการใช้กล้อง");
    }
  }

  function stopScanner() {
    html5QrRef.current?.stop().catch(() => {});
    setScanning(false);
  }

  useEffect(() => {
    return () => { html5QrRef.current?.stop().catch(() => {}); };
  }, []);

  return (
    <div className="mt-4">
      {!scanning ? (
        <button
          onClick={startScanner}
          className="w-full px-4 py-3 rounded-xl font-medium text-sm border-2 border-dashed transition"
          style={{ borderColor: teal, color: teal }}
        >
          📷 สแกน QR Code
        </button>
      ) : (
        <div>
          <div id="qr-reader" ref={scannerRef} className="rounded-xl overflow-hidden mb-3" />
          <button
            onClick={stopScanner}
            className="w-full px-4 py-2 rounded-xl text-sm"
            style={{ background: `${teal}22`, color: dark }}
          >
            ปิดกล้อง
          </button>
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
    </div>
  );
}
