"use client";

import { useRef, useState } from "react";

/** لوحة توقيع رقمي باللمس أو الفأرة، تُخرج صورة PNG */
export function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  // يُضبط حجم اللوحة عند أول لمسة لأنها قد تُركَّب داخل نافذة مخفية (عرض صفري)
  const ensureSize = () => {
    const c = ref.current!;
    const ratio = window.devicePixelRatio || 1;
    const w = Math.round(c.offsetWidth * ratio);
    const h = Math.round(c.offsetHeight * ratio);
    if (c.width === w && c.height === h) return;
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0A0C10";
  };

  const point = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const clear = () => {
    const c = ref.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setEmpty(true);
    onChange(null);
  };

  return (
    <div>
      <canvas
        ref={ref}
        aria-label="مساحة التوقيع"
        className="h-40 w-full touch-none rounded-2xl border border-dashed border-line bg-white"
        onPointerDown={(e) => {
          ensureSize();
          drawing.current = true;
          ref.current!.setPointerCapture(e.pointerId);
          const ctx = ref.current!.getContext("2d")!;
          const p = point(e);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = ref.current!.getContext("2d")!;
          const p = point(e);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }}
        onPointerUp={() => {
          drawing.current = false;
          setEmpty(false);
          onChange(ref.current!.toDataURL("image/png"));
        }}
      />
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>{empty ? "وقّع داخل المساحة أعلاه" : "تم التقاط التوقيع"}</span>
        <button type="button" onClick={clear} className="text-gold hover:underline">مسح</button>
      </div>
    </div>
  );
}
