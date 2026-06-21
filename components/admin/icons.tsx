export function EyeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M3 3l18 18" strokeLinecap="round" />
      <path d="M10.6 6.2A9.8 9.8 0 0 1 12 6c6 0 10 6 10 6a16 16 0 0 1-3 3.4M6.3 8.3A16 16 0 0 0 2 12s4 6 10 6a9.6 9.6 0 0 0 3.3-.6" strokeLinejoin="round" />
    </svg>
  );
}

export function PencilIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M4 20h4l10-10-4-4L4 16v4Z" strokeLinejoin="round" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}
