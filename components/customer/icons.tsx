/** 판매 단위 아이콘 (잔술/도쿠리/보틀) + 보조 아이콘. stroke=currentColor */

export function GlassIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={(size * 16) / 18} height={size} viewBox="0 0 16 18" fill="none">
      <path
        d="M3 5 H13 L11.3 15.5 Q11.1 16.3 10.2 16.3 H5.8 Q4.9 16.3 4.7 15.5 Z"
        fill="rgba(138,127,110,0.13)"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <path d="M4.4 8 H11.6" stroke="currentColor" strokeWidth={1} opacity={0.45} />
    </svg>
  );
}

export function TokkuriIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={(size * 22) / 26} height={size} viewBox="0 0 22 26" fill="none">
      <path
        d="M8 2.5 H14 V5 Q14 6.2 15.2 7 Q18 9 18 14.5 Q18 23 11 23 Q4 23 4 14.5 Q4 9 6.8 7 Q8 6.2 8 5 Z"
        fill="rgba(138,127,110,0.13)"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BottleIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={(size * 18) / 34} height={size} viewBox="0 0 18 34" fill="none">
      <path
        d="M7 2 H11 V6.5 Q11 8.5 12.4 10 Q14 11.7 14 14.5 V30 Q14 32 12 32 H6 Q4 32 4 30 V14.5 Q4 11.7 5.6 10 Q7 8.5 7 6.5 Z"
        fill="rgba(138,127,110,0.13)"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 이미지 빈 상태 일러스트 (산 + 해) */
export function ImagePlaceholderIcon({ size = 80 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={(size * 60) / 80}
      viewBox="0 0 80 60"
      fill="none"
      stroke="#a99e8c"
      strokeWidth={2}
    >
      <rect x="3" y="3" width="74" height="54" rx="8" />
      <circle cx="24" cy="22" r="7" />
      <path
        d="M6 52 L28 30 L42 44 L54 30 L74 52"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
