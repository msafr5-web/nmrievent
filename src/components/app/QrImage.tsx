"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

export function QrImage({ value, size = 180, label }: { value: string; size?: number; label: string }) {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    QRCode.toDataURL(value, { width: size * 2, margin: 1, errorCorrectionLevel: "H", color: { dark: "#0A0C10", light: "#FFFFFF" } })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [value, size]);
  return (
    <div className="inline-block rounded-2xl bg-white p-3" style={{ width: size + 24, height: size + 24 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} width={size} height={size} alt={label} />}
    </div>
  );
}
