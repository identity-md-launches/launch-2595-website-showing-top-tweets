import type { CSSProperties } from "react";

export type IconName =
  | "fire"
  | "clock"
  | "bookmark"
  | "search"
  | "arrow"
  | "external"
  | "close"
  | "heart"
  | "repeat"
  | "reply"
  | "share"
  | "info"
  | "chevron"
  | "check"
  | "spark"
  | "grid"
  | "x"
  | "leaf";
const paths: Record<IconName, React.ReactNode> = {
  fire: (
    <path d="M12 3c2 5-2 5 1 9 1-3 4-3 4-6 6 8 3 15-5 15C3 21 1 12 8 6c-1 5 2 5 2 7 3-4-1-6 2-10Z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  bookmark: <path d="M6 4h12v17l-6-4-6 4V4Z" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6m0-6L10 14M10 5H5v14h14v-5" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  heart: (
    <path d="M20.8 5.6a5.3 5.3 0 0 0-7.5 0L12 7l-1.3-1.4a5.3 5.3 0 0 0-7.5 7.5L12 22l8.8-8.9a5.3 5.3 0 0 0 0-7.5Z" />
  ),
  repeat: (
    <>
      <path d="m16 3 4 4-4 4M4 11V7h16M8 21l-4-4 4-4m12 0v4H4" />
    </>
  ),
  reply: <path d="M21 11a9 9 0 0 1-9 9H4l1-5a9 9 0 1 1 16-4Z" />,
  share: (
    <>
      <path d="M12 16V3m-5 5 5-5 5 5M5 13v7h14v-7" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6m0-10v1" />
    </>
  ),
  chevron: <path d="m8 10 4 4 4-4" />,
  check: <path d="m5 12 4 4L19 6" />,
  spark: (
    <>
      <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  x: <path d="M5 4h4l11 16h-5L4 4m16 0L4 20" />,
  leaf: <path d="M20 3C7 2 1 7 5 15c8 5 14 0 15-12ZM5 20 16 8" />,
};
export function Icon({
  name,
  size = 20,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {paths[name]}
    </svg>
  );
}
