"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadRepairPhoto } from "./actions";

function imageUrl(path: string, baseUrl: string) {
  if (/^https?:\/\//i.test(path)) return path;
  if (!baseUrl) return path;
  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function RepairPhotos({
  repairId,
  initialPhotos,
  uploadBaseUrl,
}: {
  repairId: string;
  initialPhotos: string[];
  uploadBaseUrl: string;
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const renderedPhotos = useMemo(
    () => photos.map((photo) => ({ path: photo, url: imageUrl(photo, uploadBaseUrl) })),
    [photos, uploadBaseUrl],
  );

  async function onUpload() {
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const result = await uploadRepairPhoto(repairId, formData);
      setPhotos(result.photos);
      setFile(null);
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 mb-6" style={{ border: "1px solid #0F172008" }}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="font-bold" style={{ color: "#0F1720" }}>รูปจากร้าน (ระหว่างซ่อม)</p>
        <label
          className="text-xs px-4 py-2 rounded-xl font-bold cursor-pointer transition-all hover:opacity-80"
          style={{ background: "#0F172006", color: "#0F1720" }}
        >
          เลือกรูป
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
        </label>
      </div>

      {renderedPhotos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {renderedPhotos.map((photo) => (
            <a
              key={photo.path}
              href={photo.url}
              target="_blank"
              className="block aspect-square rounded-xl overflow-hidden bg-gray-50 transition-all hover:opacity-80"
              style={{ border: "1px solid #0F172008" }}
            >
              <img src={photo.url} alt="Repair device" className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      ) : (
        <p className="text-sm mb-4" style={{ color: "#4A7A8A" }}>ยังไม่มีรูปภาพ</p>
      )}

      {previewUrl && (
        <div className="pt-4" style={{ borderTop: "1px solid #0F172008" }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#4A7A8A" }}>
            Preview ก่อนอัปโหลด
          </p>
          <div className="flex gap-4 items-end">
            <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-50 shrink-0" style={{ border: "1px solid #0F172008" }}>
              <img src={previewUrl} alt="Selected repair device preview" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate" style={{ color: "#0F1720" }}>{file?.name}</p>
              <p className="text-xs mb-3" style={{ color: "#4A7A8A" }}>
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ""}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onUpload}
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all hover:opacity-90"
                  style={{ background: "#0F1720" }}
                >
                  {uploading ? "กำลังอัปโหลด..." : "อัปโหลด"}
                </button>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-xl text-sm disabled:opacity-50 transition-all"
                  style={{ background: "#0F172006", color: "#4A7A8A" }}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm font-bold text-red-600 mt-3">{error}</p>}
    </div>
  );
}
