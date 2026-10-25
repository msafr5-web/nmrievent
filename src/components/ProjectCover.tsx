/**
 * غلاف بصري مولّد لكل مشروع (SVG خفيف بدل الصور الثقيلة)
 * يُستبدل بصورة حقيقية عبر next/image عند ربط نظام إدارة المحتوى.
 */
export function ProjectCover({ palette, seed, className = "" }: { palette: [string, string]; seed: string; className?: string }) {
  const h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const id = `g${h.toString(36)}`;
  const rings = Array.from({ length: 6 }, (_, i) => 40 + i * 38 + (h % 17));
  const cx = 120 + (h % 160);
  const cy = 60 + ((h >> 5) % 120);

  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-hidden>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={palette[0]} />
          <stop offset="1" stopColor="#0A0C10" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx={cx / 400} cy={cy / 260} r=".6">
          <stop offset="0" stopColor={palette[1]} stopOpacity=".75" />
          <stop offset="1" stopColor={palette[1]} stopOpacity="0" />
        </radialGradient>
        <pattern id={`${id}-p`} width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="12" height="12" fill={palette[1]} opacity=".07" />
        </pattern>
      </defs>
      <rect width="400" height="260" fill={`url(#${id}-bg)`} />
      <rect width="400" height="260" fill={`url(#${id}-p)`} />
      <rect width="400" height="260" fill={`url(#${id}-glow)`} />
      {rings.map((r, i) => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={palette[1]} strokeOpacity={0.35 - i * 0.05} strokeWidth="1" />
      ))}
      <path d={`M0 ${200 + (h % 30)} Q 100 ${170 + (h % 40)} 200 ${195} T 400 ${185 + (h % 25)} V260 H0z`} fill="#0A0C10" opacity=".55" />
    </svg>
  );
}
