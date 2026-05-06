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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="font-bold text-sm">🔧 รูปจากร้าน (ระหว่างซ่อม)</p>
        <label className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 cursor-pointer">
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
              className="block aspect-square rounded-lg overflow-hidden border border-gray-100 bg-gray-50"
            >
              <img src={photo.url} alt="Repair device" className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-4">ยังไม่มีรูปภาพ</p>
      )}

      {previewUrl && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-500 mb-2">Preview ก่อนอัปโหลด</p>
          <div className="flex gap-3 items-end">
            <div className="w-28 h-28 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 shrink-0">
              <img src={previewUrl} alt="Selected repair device preview" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{file?.name}</p>
              <p className="text-xs text-gray-500 mb-3">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ""}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onUpload}
                  disabled={uploading}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  {uploading ? "กำลังอัปโหลด..." : "อัปโหลด"}
                </button>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  disabled={uploading}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm disabled:opacity-50"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </div>
  );
}
