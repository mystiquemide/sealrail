type SealrailMarkProps = {
  width?: number;
  height?: number;
  strokeColor?: string;
  accent?: string;
};

export function SealrailMark({
  width = 28,
  height = 20,
  strokeColor = "#2C2C2B",
  accent = "#FF2D2D",
}: SealrailMarkProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 30 22" fill="none" aria-hidden="true">
      <line x1="0" y1="11" x2="9" y2="11" stroke={strokeColor} strokeWidth="1.25" />
      <line x1="21" y1="11" x2="30" y2="11" stroke={strokeColor} strokeWidth="1.25" />
      <circle cx="15" cy="11" r="6" stroke={strokeColor} strokeWidth="1.25" />
      <circle cx="15" cy="11" r="2.4" fill={accent} />
      <line x1="15" y1="5.2" x2="15" y2="8" stroke={strokeColor} strokeWidth="1.25" />
    </svg>
  );
}
