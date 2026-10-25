"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "../icons";

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="w-[min(36rem,calc(100vw-2rem))] rounded-3xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
        <h3 className="text-lg font-bold text-gold">{title}</h3>
        <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-elevated hover:text-fg" aria-label="إغلاق">
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto p-6">{open && children}</div>
    </dialog>
  );
}
